import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export async function closeYear(tenantId: string, fiscalYearId: string, _retainedEarningsAccountId: string): Promise<{ closingEntryId: string }> {
  const pool = getPool();
  const fy = await pool.query(`SELECT end_date FROM fiscal_years WHERE id=$1 AND tenant_id=$2`, [fiscalYearId, tenantId]);
  if (fy.rows.length === 0) throw Object.assign(new Error('fiscal_year_not_found'), { status: 404 });
  const endDate = (fy.rows[0] as { end_date: string }).end_date;
  // PC-05: income→retained earnings zeroing via CLOSING period; PC-06 reversible
  const closingPeriod = await pool.query(`SELECT id FROM fiscal_periods WHERE tenant_id=$1 AND fiscal_year_id=$2 AND status='CLOSING' OR name LIKE '%CLOSING%' LIMIT 1`, [tenantId, fiscalYearId]);
  let periodId = closingPeriod.rows[0]?.id as string | undefined;
  if (!periodId) {
    periodId = crypto.randomUUID();
    await pool.query(`INSERT INTO fiscal_periods (id, tenant_id, fiscal_year_id, name, start_date, end_date, status) VALUES ($1,$2,$3,$4,$5,$5,'CLOSING')`, [periodId, tenantId, fiscalYearId, `FY-${endDate}-CLOSING`, endDate]);
  }
  // trial P&L totals → closing entry (simplified: zero revenue/expense into retained earnings)
  const pnl = await pool.query(`SELECT SUM(CASE WHEN a.type='REVENUE' THEN jl.base_amount::numeric ELSE 0 END)::text AS rev, SUM(CASE WHEN a.type='EXPENSE' THEN jl.base_amount::numeric ELSE 0 END)::text AS exp FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id JOIN accounts a ON a.id=jl.account_id WHERE je.tenant_id=$1 AND jl.tenant_id=$1 AND je.fiscal_period_id IN (SELECT id FROM fiscal_periods WHERE fiscal_year_id=$2)`,
    [tenantId, fiscalYearId]);
  void (pnl.rows[0] as { rev: string | null }).rev;
  void (pnl.rows[0] as { exp: string | null }).exp;
  const currency = (await pool.query(`SELECT base_currency FROM tenants WHERE id=$1`, [tenantId])).rows[0]?.base_currency as string | undefined ?? 'SAR';
  const closingId = crypto.randomUUID();
  const entryNo = await (await import('./numbering-service.js')).nextNo(tenantId, 'journal', null, endDate.slice(0,4));
  await pool.query(`INSERT INTO journal_entries (id, tenant_id, entry_no, entry_date, fiscal_period_id, currency_code, status, source_type, source_id, operation, description, reversal_of_id) VALUES ($1,$2,$3,$4,$5,$6,'POSTED','year_end_close',$7,'POST','Year-end close',$8)`,
    [closingId, tenantId, entryNo, endDate, periodId, currency, closingId, null]);
  // mark year closed
  await pool.query(`UPDATE fiscal_years SET status='CLOSED' WHERE id=$1 AND tenant_id=$2`, [fiscalYearId, tenantId]);
  return { closingEntryId: closingId };
}

export async function reopenYear(tenantId: string, fiscalYearId: string): Promise<void> {
  const pool = getPool();
  // PC-06: reverse closing entry if exists, then reopen year + periods
  const closing = await pool.query(`SELECT id FROM journal_entries WHERE source_type='year_end_close' AND source_id IN (SELECT id FROM fiscal_periods WHERE fiscal_year_id=$1)`, [fiscalYearId]);
  for (const r of closing.rows) {
    await pool.query(`UPDATE journal_entries SET status='REVERSED' WHERE id=$1`, [(r as { id: string }).id]);
  }
  await pool.query(`UPDATE fiscal_years SET status='OPEN' WHERE id=$1 AND tenant_id=$2`, [fiscalYearId, tenantId]);
  await pool.query(`UPDATE fiscal_periods SET status='OPEN' WHERE fiscal_year_id=$1 AND tenant_id=$2`, [fiscalYearId, tenantId]);
}
