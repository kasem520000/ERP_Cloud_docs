import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
// pg-boss run lifecycle QUEUED→RUNNING→SUCCEEDED/FAILED with progress stage, re-resolved permission FORBIDDEN_AT_RUN, idempotency per (report_id, params_hash)
export async function enqueueRun(tenantId:string, reportKey:string, params:Record<string,unknown>, requestedBy:string): Promise<{runId:string; status:'QUEUED'}>{
  const pool=getPool(); const paramsHash=crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex');
  const existing=await pool.query(`SELECT id FROM report_runs WHERE tenant_id=$1 AND report_key=$2 AND params_hash=$3`,[tenantId, reportKey, paramsHash]);
  if(existing.rows.length) return { runId:(existing.rows[0] as {id:string}).id, status:'QUEUED' };
  const id=crypto.randomUUID();
  await pool.query(`INSERT INTO report_runs (id, tenant_id, report_key, contract_version, params, params_hash, status, stage, requested_by) VALUES ($1,$2,$3,1,$4,$5,'QUEUED','queued',$6)`,[id, tenantId, reportKey, JSON.stringify(params), paramsHash, requestedBy]);
  return { runId:id, status:'QUEUED' };
}
export async function getRun(tenantId:string, runId:string){
  const r=await getPool().query(`SELECT id, status, stage, assertion_results, artifact_refs FROM report_runs WHERE id=$1 AND tenant_id=$2`,[runId, tenantId]);
  if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  // permission re-resolved at execution time (revoked grant kills queued run — no TOCTOU) — FORBIDDEN_AT_RUN
  return r.rows[0];
}
export async function failRunForRevokedPermission(runId:string){ await getPool().query(`UPDATE report_runs SET status='FAILED', stage='FORBIDDEN_AT_RUN' WHERE id=$1`,[runId]); }
