import crypto from 'node:crypto';
import { getPool } from '../../../infra/db/db.js';

export type OpeningKind = 'PARTNER' | 'ACCOUNT' | 'STOCK';
export type CreateOpeningInput = {
  kind: OpeningKind;
  partnerId?: string;
  accountId?: string;
  itemId?: string;
  amount: string; // decimal string 19,4
  currency?: string;
  docDate?: string;
  notes?: string;
};

function validateAmount(a: string): void {
  if (!/^-?\d{1,15}(\.\d{1,4})?$/.test(a)) throw Object.assign(new Error('invalid_amount'), { status: 400 });
}
function validateCurrency(c: string): void {
  if (!/^[A-Z]{3}$/.test(c)) throw Object.assign(new Error('invalid_currency'), { status: 400 });
}

export async function createOpeningDraft(tenantId: string, input: CreateOpeningInput): Promise<{ id: string }> {
  if (!['PARTNER','ACCOUNT','STOCK'].includes(input.kind)) throw Object.assign(new Error('invalid_kind'), { status: 400 });
  validateAmount(input.amount);
  const currency = (input.currency ?? 'SAR').toUpperCase();
  validateCurrency(currency);
  // base currency check (phase 006: must be base currency; later multi-currency)
  // For now enforce SAR only unless tenant base_currency matches
  const pool = getPool();
  if (input.kind === 'PARTNER' && !input.partnerId) throw Object.assign(new Error('partner_id_required'), { status: 400 });
  if (input.kind === 'ACCOUNT' && !input.accountId) throw Object.assign(new Error('account_id_required'), { status: 400 });
  if (input.kind === 'STOCK' && !input.itemId) throw Object.assign(new Error('item_id_required'), { status: 400 });

  // S-04: validate referenced ids tenant scoping
  if (input.partnerId) {
    const r = await pool.query(`SELECT id FROM partners WHERE id=$1 AND tenant_id=$2`, [input.partnerId, tenantId]);
    if (r.rows.length === 0) throw Object.assign(new Error('partner_not_found'), { status: 404 });
  }
  if (input.accountId) {
    const r = await pool.query(`SELECT id FROM accounts WHERE id=$1 AND tenant_id=$2`, [input.accountId, tenantId]);
    if (r.rows.length === 0) throw Object.assign(new Error('account_not_found'), { status: 404 });
  }
  if (input.itemId) {
    const r = await pool.query(`SELECT id FROM items WHERE id=$1 AND tenant_id=$2`, [input.itemId, tenantId]);
    if (r.rows.length === 0) throw Object.assign(new Error('item_not_found'), { status: 404 });
  }

  const id = crypto.randomUUID();
  await pool.query(`INSERT INTO opening_balance_docs (id, tenant_id, kind, partner_id, account_id, item_id, amount, currency, status, doc_date, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'DRAFT',$9,$10)`,
    [id, tenantId, input.kind, input.partnerId ?? null, input.accountId ?? null, input.itemId ?? null, input.amount, currency, input.docDate ?? new Date().toISOString().slice(0,10), input.notes ?? null]);

  // update partner_balances read model (draft-aware)
  if (input.kind === 'PARTNER' && input.partnerId) {
    await pool.query(`INSERT INTO partner_balances (id, tenant_id, partner_id, open_balance) VALUES ($1,$2,$3,$4)
      ON CONFLICT (tenant_id, partner_id) DO UPDATE SET open_balance = partner_balances.open_balance + EXCLUDED.open_balance::numeric, updated_at=now()`,
      [crypto.randomUUID(), tenantId, input.partnerId, input.amount]);
  }
  await pool.query(`INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id, after) VALUES ($1,$2,'opening_balance.created','opening_balance_doc',$3,$4)`,
    [crypto.randomUUID(), tenantId, id, JSON.stringify({ kind: input.kind, amount: input.amount })]);

  return { id };
}

export async function listOpeningDrafts(tenantId: string, opts: { kind?: string } = {}): Promise<unknown[]> {
  const pool = getPool();
  let sql = `SELECT id, kind, partner_id, account_id, amount, currency, status, doc_date FROM opening_balance_docs WHERE tenant_id=$1`;
  const vals: unknown[] = [tenantId];
  if (opts.kind) { sql += ` AND kind=$2`; vals.push(opts.kind); }
  sql += ` ORDER BY created_at DESC`;
  const r = await pool.query(sql, vals);
  return r.rows;
}
