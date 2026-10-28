import { getPool } from '../../../infra/db/db.js';

// PC-04 close checklist
const ITEMS = ['reconciliation_passed', 'approvals_cleared', 'fx_revalued', 'recurring_posted'];

export async function getChecklist(tenantId: string, periodId: string): Promise<{ items: { key: string; status: 'PENDING'|'DONE' }[]; canLock: boolean }> {
  const pool = getPool();
  // check approvals pending
  const pending = await pool.query(`SELECT id FROM journal_entries WHERE tenant_id=$1 AND fiscal_period_id=$2 AND status='PENDING_APPROVAL' LIMIT 1`, [tenantId, periodId]);
  const recon = await pool.query(`SELECT id FROM reconciliation_runs WHERE tenant_id=$1 AND status='BROKEN' AND run_at > now()-interval '7 days' LIMIT 1`, [tenantId]);
  const items = ITEMS.map(k => {
    if (k === 'approvals_cleared') return { key: k, status: (pending.rows.length === 0 ? 'DONE' as const : 'PENDING' as const) };
    if (k === 'reconciliation_passed') return { key: k, status: (recon.rows.length === 0 ? 'DONE' as const : 'PENDING' as const) };
    return { key: k, status: 'DONE' as const }; // stub others done
  });
  const canLock = items.every(i => i.status === 'DONE');
  return { items, canLock };
}
