import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
// attribution only; commissions deferred to PHASE-017 — no commission computation
export async function createSalesRep(tenantId:string, userId:string, code:string, name:string): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID();
  await pool.query(`INSERT INTO sales_reps (id, tenant_id, user_id, code, name) VALUES ($1,$2,$3,$4,$5)`,[id, tenantId, userId, code, name]);
  return {id};
}
export async function listReps(tenantId:string){ return (await getPool().query(`SELECT id, code, name FROM sales_reps WHERE tenant_id=$1`,[tenantId])).rows; }
