import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export async function revalueFx(tenantId: string, baseCurrency: string, date: string): Promise<{ entryId: string | null }> {
  const pool = getPool();
  // find FX-denominated balances (accounts with currency_code != base) with postings
  const accounts = await pool.query(`SELECT DISTINCT jl.account_id, a.currency_code FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id JOIN accounts a ON a.id=jl.account_id WHERE jl.tenant_id=$1 AND a.currency_code IS NOT NULL AND a.currency_code != $2 AND je.status='POSTED'`, [tenantId, baseCurrency]);
  if (accounts.rows.length === 0) return { entryId: null };
  // would compute unrealized gain/loss vs current rates and post delta; for now emit synthetic entry
  const period = await pool.query(`SELECT id FROM fiscal_periods WHERE tenant_id=$1 AND $2::date BETWEEN start_date AND end_date`, [tenantId, date]);
  if (period.rows.length === 0) return { entryId: null };
  // resolve FX gain/loss purpose account
  const fxPurpose = await pool.query(`SELECT account_id FROM account_purposes WHERE tenant_id=$1 AND purpose_key='fx_gain_loss' AND active_to IS NULL`, [tenantId]);
  if (fxPurpose.rows.length === 0) return { entryId: null };
  const entryId = crypto.randomUUID();
  const { nextNo } = await import('./numbering-service.js');
  const entryNo = await nextNo(tenantId, 'journal', null, date.slice(0,4));
  await pool.query(`INSERT INTO journal_entries (id, tenant_id, entry_no, entry_date, fiscal_period_id, currency_code, status, source_type, source_id, operation, description) VALUES ($1,$2,$3,$4,$5,$6,'POSTED','fx_revaluation',$7,'POST','FX revaluation ${date}')`,
    [entryId, tenantId, entryNo, date, (period.rows[0] as { id: string }).id, baseCurrency, entryId]);
  return { entryId };
}
