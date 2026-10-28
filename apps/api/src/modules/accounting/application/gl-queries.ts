import { getPool } from '../../../infra/db/db.js';

// INV-006 completeness — full provenance drill-down

export async function trialBalance(tenantId: string, from: string, to: string): Promise<{ accountId: string; debit: string; credit: string; baseDebit: string; baseCredit: string }[]> {
  const pool = getPool();
  const r = await pool.query(`SELECT account_id, SUM(CASE WHEN direction='debit' THEN amount::numeric ELSE 0 END) AS debit, SUM(CASE WHEN direction='credit' THEN amount::numeric ELSE 0 END) AS credit, SUM(CASE WHEN direction='debit' THEN base_amount::numeric ELSE 0 END) AS base_debit, SUM(CASE WHEN direction='credit' THEN base_amount::numeric ELSE 0 END) AS base_credit
    FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id WHERE jl.tenant_id=$1 AND je.entry_date BETWEEN $2 AND $3 AND je.status='POSTED' GROUP BY account_id ORDER BY account_id`, [tenantId, from, to]);
  return r.rows as unknown as { accountId: string; debit: string; credit: string; baseDebit: string; baseCredit: string }[];
}

export async function journalRegister(tenantId: string, opts: { from?: string; to?: string; accountId?: string; limit?: number; offset?: number }): Promise<{ items: unknown[]; total: number }> {
  const pool = getPool();
  const limit = Math.min(opts.limit ?? 20, 100);
  const offset = opts.offset ?? 0;
  const conds: string[] = [`je.tenant_id=$1`];
  const params: unknown[] = [tenantId];
  let idx = 2;
  if (opts.from) { conds.push(`je.entry_date >= $${idx++}`); params.push(opts.from); }
  if (opts.to) { conds.push(`je.entry_date <= $${idx++}`); params.push(opts.to); }
  if (opts.accountId) { conds.push(`jl.account_id = $${idx++}`); params.push(opts.accountId); }
  const where = conds.join(' AND ');
  const countR = await pool.query(`SELECT COUNT(*)::int AS total FROM journal_entries je LEFT JOIN journal_lines jl ON jl.journal_entry_id=je.id WHERE ${where}`, params);
  const itemsR = await pool.query(`SELECT je.id, je.entry_no, je.entry_date, je.description, je.currency_code, je.status, json_agg(json_build_object('account_id', jl.account_id, 'direction', jl.direction, 'amount', jl.amount, 'base_amount', jl.base_amount)) AS lines
    FROM journal_entries je JOIN journal_lines jl ON jl.journal_entry_id=je.id WHERE ${where} GROUP BY je.id ORDER BY je.entry_date DESC, je.entry_no LIMIT $${idx} OFFSET $${idx+1}`, [...params, limit, offset]);
  return { items: itemsR.rows, total: (countR.rows[0] as { total: number }).total };
}

export async function accountStatement(tenantId: string, accountId: string, from: string, to: string): Promise<{ opening: string; closing: string; lines: unknown[] }> {
  const pool = getPool();
  const opening = await pool.query(`SELECT COALESCE(SUM(CASE WHEN jl.direction='debit' THEN jl.base_amount::numeric ELSE -jl.base_amount::numeric END),0)::text AS bal FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id WHERE jl.tenant_id=$1 AND jl.account_id=$2 AND je.entry_date < $3 AND je.status='POSTED'`, [tenantId, accountId, from]);
  const lines = await pool.query(`SELECT je.entry_no, je.entry_date, jl.direction, jl.amount, jl.base_amount, je.description FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id WHERE jl.tenant_id=$1 AND jl.account_id=$2 AND je.entry_date BETWEEN $3 AND $4 AND je.status='POSTED' ORDER BY je.entry_date, je.entry_no, jl.line_no`, [tenantId, accountId, from, to]);
  const closing = await pool.query(`SELECT COALESCE(SUM(CASE WHEN jl.direction='debit' THEN jl.base_amount::numeric ELSE -jl.base_amount::numeric END),0)::text AS bal FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id WHERE jl.tenant_id=$1 AND jl.account_id=$2 AND je.entry_date <= $3 AND je.status='POSTED'`, [tenantId, accountId, to]);
  return { opening: (opening.rows[0] as { bal: string }).bal, closing: (closing.rows[0] as { bal: string }).bal, lines: lines.rows };
}
