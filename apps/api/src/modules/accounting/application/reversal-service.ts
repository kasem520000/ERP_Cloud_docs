import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export async function reverseJournal(tenantId: string, entryId: string, reason: string, branchId: string | null = null): Promise<{ id: string; entryNo: string }> {
  const pool = getPool();
  const orig = await pool.query(`SELECT id, entry_date, currency_code, exchange_rate, status, reversal_of_id, fiscal_period_id FROM journal_entries WHERE id=$1 AND tenant_id=$2`, [entryId, tenantId]);
  if (orig.rows.length === 0) throw Object.assign(new Error('entry_not_found'), { status: 404 });
  const o = orig.rows[0] as { entry_date: string; currency_code: string; exchange_rate: string; status: string; reversal_of_id: string | null };
  if (o.status !== 'POSTED') throw Object.assign(new Error('ALREADY_REVERSED'), { status: 409 });
  if (o.reversal_of_id) throw Object.assign(new Error('ALREADY_REVERSED: this entry is already a reversal'), { status: 409 });
  // check already reversed
  const already = await pool.query(`SELECT id FROM journal_entries WHERE reversal_of_id=$1 AND tenant_id=$2`, [entryId, tenantId]);
  if (already.rows.length > 0) throw Object.assign(new Error('ALREADY_REVERSED'), { status: 409 });
  const lines = await pool.query(`SELECT account_id, direction, amount, base_amount, partner_id, memo FROM journal_lines WHERE journal_entry_id=$1 ORDER BY line_no`, [entryId]);
  const today = new Date().toISOString().slice(0, 10);
  // check period open for reversal date
  const period = await pool.query(`SELECT id, status FROM fiscal_periods WHERE tenant_id=$1 AND $2::date BETWEEN start_date AND end_date`, [tenantId, today]);
  if (period.rows.length === 0) throw Object.assign(new Error('PERIOD_NOT_FOUND'), { status: 400 });
  if ((period.rows[0] as { status: string }).status !== 'OPEN') throw Object.assign(new Error('PERIOD_LOCKED'), { status: 409 });

  const { nextNo } = await import('./numbering-service.js');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const entryNo = await nextNo(tenantId, 'journal', branchId, today.slice(0,4), client);
    const revId = crypto.randomUUID();
    await client.query(`INSERT INTO journal_entries (id, tenant_id, entry_no, entry_date, fiscal_period_id, currency_code, exchange_rate, status, source_type, source_id, operation, description, reversal_of_id) VALUES ($1,$2,$3,$4,$5,$6,$7,'POSTED','reversal',$8,'REVERSE',$9,$10)`,
      [revId, tenantId, entryNo, today, (period.rows[0] as { id: string }).id, o.currency_code, o.exchange_rate, revId, `reversal of ${entryId}: ${reason}`, entryId]);
    for (let i = 0; i < lines.rows.length; i++) {
      const l = lines.rows[i] as { account_id: string; direction: string; amount: string; base_amount: string; partner_id: string | null; memo: string | null };
      const flipped = l.direction === 'debit' ? 'credit' : 'debit';
      await client.query(`INSERT INTO journal_lines (id, tenant_id, journal_entry_id, line_no, account_id, direction, amount, base_amount, partner_id, memo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [crypto.randomUUID(), tenantId, revId, i+1, l.account_id, flipped, l.amount, l.base_amount, l.partner_id, l.memo]);
    }
    await client.query(`UPDATE journal_entries SET reversed_by_id=$1 WHERE id=$2`, [revId, entryId]);
    await client.query('COMMIT');
    return { id: revId, entryNo };
  } catch (e) { await client.query('ROLLBACK').catch(()=>undefined); throw e; } finally { (client as { release: () => void }).release(); }
}
