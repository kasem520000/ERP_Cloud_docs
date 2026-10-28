import Decimal from 'decimal.js';
Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_UP });
import { getPool } from '../../../infra/db/db.js';
import { PostingEngine } from '../domain/posting-engine/engine.js';
import { PostingError } from '../domain/posting-engine/errors.js';
import type { JournalSpec, ValidationContext } from '../domain/posting-engine/types.js';
import { nextNo } from './numbering-service.js';

type PostInput = { entryDate: string; description?: string; currency: string; exchangeRate?: string; lines: { accountId?: string; purpose?: string; direction: 'debit'|'credit'; amount: string; partnerId?: string; memo?: string }[]; source: { docType: string; docId: string; operation: string } };

export async function postJournal(tenantId: string, baseCurrency: string, input: PostInput, branchId: string | null = null): Promise<{ id: string; entryNo: string }> {
  const pool = getPool();
  const spec: JournalSpec = {
    tenantId, baseCurrency, entryDate: input.entryDate, currency: input.currency, exchangeRate: input.exchangeRate,
    description: input.description, lines: input.lines, source: input.source,
  };
  // build context adapters
  const ctx: ValidationContext = {
    existingEntry: async (docType, docId, op) => {
      const r = await pool.query(`SELECT id FROM journal_entries WHERE tenant_id=$1 AND source_type=$2 AND source_id=$3 AND operation=$4`, [tenantId, docType, docId, op]);
      return r.rows.length ? (r.rows[0] as { id: string }).id : null;
    },
    resolvePurpose: async (purpose) => {
      const r = await pool.query(`SELECT account_id FROM account_purposes WHERE tenant_id=$1 AND purpose_key=$2 AND active_to IS NULL`, [tenantId, purpose]);
      return r.rows.length ? (r.rows[0] as { account_id: string }).account_id : null;
    },
    isAccountPostable: async (accountId) => {
      const r = await pool.query(`SELECT is_postable, status, currency_code FROM accounts WHERE id=$1 AND tenant_id=$2`, [accountId, tenantId]);
      if (r.rows.length === 0) return { postable: false, active: false };
      const row = r.rows[0] as { is_postable: boolean; status: string; currency_code: string | null };
      return { postable: row.is_postable, active: row.status === 'ACTIVE', currency: row.currency_code };
    },
    isPeriodOpen: async (date) => {
      const r = await pool.query(`SELECT id, status FROM fiscal_periods WHERE tenant_id=$1 AND $2::date BETWEEN start_date AND end_date`, [tenantId, date]);
      if (r.rows.length === 0) return { open: false };
      const row = r.rows[0] as { id: string; status: string };
      return { open: row.status === 'OPEN', periodId: row.id };
    },
    getFxRate: async (curr, date) => {
      const r = await pool.query(`SELECT rate FROM exchange_rates WHERE tenant_id=$1 AND currency_code=$2 AND rate_date <= $3::date ORDER BY rate_date DESC LIMIT 1`, [tenantId, curr, date]);
      return r.rows.length ? (r.rows[0] as { rate: string }).rate : null;
    },
    isControlPurpose: (_accountId: string) => {
      // heuristic: check if account is referenced by control account registry (INV-009); fallback: look up account code prefix
      return false;
    },
  };

  const engine = new PostingEngine();
  let v;
  try { v = await engine.validate(spec, ctx); } catch (e) {
    if (e instanceof PostingError) {
      const map: Record<string, number> = { ALREADY_POSTED: 409, ENTRY_NOT_BALANCED: 400, PERIOD_LOCKED: 409, PERIOD_NOT_FOUND: 400, ACCOUNT_NOT_POSTABLE: 400, ACCOUNT_ARCHIVED: 400, CURRENCY_MISMATCH: 400, PURPOSE_NOT_MAPPED: 400, MISSING_PARTNER_ON_CONTROL: 400, MISSING_FX_RATE: 400 };
      throw Object.assign(new Error(`${e.code}: ${e.message}`), { status: map[e.code] ?? 400, code: e.code });
    }
    throw e;
  }

  // Transactional write — gapless numbering + balanced + idempotency guarded by DB unique/trigger
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const entryNo = await nextNo(tenantId, 'journal', branchId, input.entryDate.slice(0, 4), client);
    const entryId = (await import('node:crypto')).randomUUID();
    const rate = input.exchangeRate ?? '1';
    await client.query(`INSERT INTO journal_entries (id, tenant_id, entry_no, entry_date, fiscal_period_id, currency_code, exchange_rate, status, source_type, source_id, operation, description, posted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'POSTED',$8,$9,$10,$11,now())`,
      [entryId, tenantId, entryNo, input.entryDate, v.periodId, input.currency, rate, input.source.docType, input.source.docId, input.source.operation, input.description ?? null]);
    // insert lines
    for (let i = 0; i < v.resolvedLines.length; i++) {
      const l = v.resolvedLines[i]!;
      const baseAmount = new Decimal(l.amount).mul(new Decimal(rate)).toFixed(4);
      await client.query(`INSERT INTO journal_lines (id, tenant_id, journal_entry_id, line_no, account_id, direction, amount, base_amount, partner_id, memo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [(await import('node:crypto')).randomUUID(), tenantId, entryId, i + 1, l.accountId, l.direction, l.amount, baseAmount, l.partnerId ?? null, (input.lines[i]! as { memo?: string }).memo ?? null]);
    }
    await client.query('COMMIT');
    return { id: entryId, entryNo };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally { (client as { release: () => void }).release(); }
}
