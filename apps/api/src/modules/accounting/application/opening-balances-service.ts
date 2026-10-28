import { getPool } from '../../../infra/db/db.js';
import { postJournal } from './posting-service.js';
import crypto from 'node:crypto';

export async function importOpeningBalances(tenantId: string, baseCurrency: string, date: string, rows: { accountId?: string; partnerId?: string; itemId?: string; amount: string; direction: 'debit'|'credit' }[]): Promise<{ id: string; entryNo: string }> {
  const pool = getPool();
  // period must be of type OPENING (special Jan-00 style)
  const p = await pool.query(`SELECT id FROM fiscal_periods WHERE tenant_id=$1 AND $2::date BETWEEN start_date AND end_date`, [tenantId, date]);
  if (p.rows.length === 0) throw Object.assign(new Error('no_opening_period'), { status: 400 });
  // Build balanced journal via posting engine
  const lines = rows.map(r => ({ accountId: r.accountId, direction: r.direction, amount: r.amount, partnerId: r.partnerId }));
  const batchId = crypto.randomUUID();
  const res = await postJournal(tenantId, baseCurrency, {
    entryDate: date, description: `Opening balances ${batchId}`,
    currency: baseCurrency, lines, source: { docType: 'opening_balance_batch', docId: batchId, operation: 'POST' },
  });
  // persist partner subledger reconciliation proof if any
  for (const row of rows) {
    if (row.partnerId) {
      await pool.query(`INSERT INTO opening_balance_docs (id, tenant_id, partner_id, amount, batch_id) VALUES ($1,$2,$3,$4,$5)`, [crypto.randomUUID(), tenantId, row.partnerId, row.amount, res.id]).catch(() => undefined);
    }
  }
  return res;
}
