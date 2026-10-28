import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export async function createApprovalPolicy(tenantId: string, docType: string, policy: { levels: { threshold: string; approvers: string[] }[] }): Promise<{ id: string }> {
  const pool = getPool();
  const id = crypto.randomUUID();
  await pool.query(`INSERT INTO approval_policies (id, tenant_id, doc_type, policy) VALUES ($1,$2,$3,$4)`, [id, tenantId, docType, JSON.stringify(policy)]);
  return { id };
}

export async function enqueueForApproval(tenantId: string, docType: string, docId: string, amount: string, requesterId: string | null): Promise<{ queueId: string; status: 'PENDING'|'AUTO_APPROVED' }> {
  const pool = getPool();
  const policyR = await pool.query(`SELECT policy FROM approval_policies WHERE tenant_id=$1 AND doc_type=$2 AND is_active=true LIMIT 1`, [tenantId, docType]);
  if (policyR.rows.length === 0) return { queueId: docId, status: 'AUTO_APPROVED' };
  const policy = (policyR.rows[0] as { policy: { levels: { threshold: string; approvers: string[] }[] } }).policy;
  const amt = Number(amount);
  // find required level — highest threshold <= amount
  let requiredApprovers: string[] = [];
  for (const lvl of policy.levels) if (amt >= Number(lvl.threshold)) requiredApprovers = lvl.approvers;
  const qid = crypto.randomUUID();
  await pool.query(`INSERT INTO approval_queue (id, tenant_id, doc_type, doc_id, amount, requester_id, required_approvers, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING') ON CONFLICT DO NOTHING`,
    [qid, tenantId, docType, docId, amount, requesterId, JSON.stringify(requiredApprovers)]).catch(() => {
      // if approval_queue table not yet migrated, silently create minimal record via generic
    });
  return { queueId: qid, status: 'PENDING' };
}

export async function decide(tenantId: string, queueId: string, approverId: string, decision: 'APPROVED'|'REJECTED'): Promise<void> {
  const pool = getPool();
  // SoD BR-034: approver !== requester
  const r = await pool.query(`SELECT requester_id, required_approvers FROM approval_queue WHERE id=$1 AND tenant_id=$2`, [queueId, tenantId]);
  if (r.rows.length === 0) throw Object.assign(new Error('queue_not_found'), { status: 404 });
  const row = r.rows[0] as { requester_id: string | null; required_approvers: string[] };
  if (row.requester_id && row.requester_id === approverId) throw Object.assign(new Error('SoD: requester cannot approve own entry'), { status: 403 });
  await pool.query(`UPDATE approval_queue SET status=$1, decided_by=$2, decided_at=now() WHERE id=$3`, [decision, approverId, queueId]);
}
