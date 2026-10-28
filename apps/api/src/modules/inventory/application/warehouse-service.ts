import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function createWarehouse(tenantId:string, branchId:string, input:{code:string; name:string}): Promise<{id:string}>{
  const pool=getPool();
  const dup=await pool.query(`SELECT id FROM warehouses WHERE tenant_id=$1 AND code=$2`,[tenantId, input.code]);
  if(dup.rows.length) throw Object.assign(new Error('code_duplicate'),{status:409});
  const id=crypto.randomUUID();
  await pool.query(`INSERT INTO warehouses (id, tenant_id, branch_id, code, name) VALUES ($1,$2,$3,$4,$5)`,[id, tenantId, branchId, input.code, input.name]);
  return {id};
}
export async function listWarehouses(tenantId:string, branchId?:string){
  const pool=getPool();
  const r=branchId ? await pool.query(`SELECT * FROM warehouses WHERE tenant_id=$1 AND branch_id=$2`,[tenantId, branchId]) : await pool.query(`SELECT * FROM warehouses WHERE tenant_id=$1`,[tenantId]);
  return r.rows;
}
