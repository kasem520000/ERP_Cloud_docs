import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

// Draft/submit/approve/post workflow for manual journals (BR-033 SoD pending — approval-gated)

export async function createDraft(tenantId: string, createdBy: string | null, input: { entryDate: string; description?: string; currency: string; lines: { accountId: string; direction: 'debit'|'credit'; amount: string; memo?: string }[] }): Promise<{ id: string }> {
  const pool = getPool();
  const period = await pool.query(`SELECT id FROM fiscal_periods WHERE tenant_id=$1 AND $2::date BETWEEN start_date AND end_date`, [tenantId, input.entryDate]);
  if (period.rows.length === 0) throw Object.assign(new Error('no_period_for_date'), { status: 400 });
  const id = crypto.randomUUID();
  await pool.query(`INSERT INTO journal_entries (id, tenant_id, entry_no, entry_date, fiscal_period_id, currency_code, status, source_type, source_id, operation, description, posted_at) VALUES ($1,$2,NULL,$3,$4,$5,'DRAFT','manual',$6,'CREATE',$7,NULL)`,
    [id, tenantId, input.entryDate, (period.rows[0] as { id: string }).id, input.currency, id, input.description ?? null]);
  for (let i = 0; i < input.lines.length; i++) {
    const l = input.lines[i]!;
    await pool.query(`INSERT INTO journal_lines (id, tenant_id, journal_entry_id, line_no, account_id, direction, amount, base_amount, memo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [crypto.randomUUID(), tenantId, id, i+1, l.accountId, l.direction, l.amount, l.amount, l.memo ?? null]);
  }
  return { id };
}

export async function submitForApproval(tenantId: string, entryId: string): Promise<{ id: string }> {
  const pool = getPool();
  // balanced check before submit (INV-001/002)
  const r = await pool.query(`SELECT SUM(CASE WHEN direction='debit' THEN amount::numeric ELSE -amount::numeric END)::text AS bal FROM journal_lines WHERE journal_entry_id=$1`, [entryId]);
  if (r.rows.length === 0 || (r.rows[0] as { bal: string }).bal !== '0') throw Object.assign(new Error('ENTRY_NOT_BALANCED'), { status: 400 });
  await pool.query(`UPDATE journal_entries SET status='PENDING_APPROVAL' WHERE id=$1 AND tenant_id=$2`, [entryId, tenantId]);
  return { id: entryId };
}

export async function postManual(tenantId: string, entryId: string): Promise<{ id: string; entryNo: string }> {
  const pool = getPool();
  const e = await pool.query(`SELECT status FROM journal_entries WHERE id=$1 AND tenant_id=$2`, [entryId, tenantId]);
  if (e.rows.length === 0) throw Object.assign(new Error('not_found'), { status: 404 });
  if ((e.rows[0] as { status: string }).status !== 'PENDING_APPROVAL') throw Object.assign(new Error('must_be_approved_first'), { status: 400 });
  // approval check
  const approval = await pool.query(`SELECT status FROM approval_queue WHERE doc_id=$1 AND tenant_id=$2`, [entryId, tenantId]);
  if (approval.rows.length === 0 || (approval.rows[0] as { status: string }).status !== 'APPROVED') throw Object.assign(new Error('requires_approval'), { status: 403 });
  const entryNo = await (await import('./numbering-service.js')).nextNo(tenantId, 'journal', null, new Date().toISOString().slice(0,10).slice(0,4));
  await pool.query(`UPDATE journal_entries SET status='POSTED', entry_no=$3, posted_at=now() WHERE id=$1 AND tenant_id=$2`, [entryId, tenantId, entryNo]);
  return { id: entryId, entryNo };
}
