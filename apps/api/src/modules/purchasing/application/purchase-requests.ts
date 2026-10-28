import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function createPurchaseRequest(tenantId:string, branchId:string, requestedBy:string, lines:{itemId:string; qty:string}[]): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); await pool.query(`INSERT INTO purchase_requests (id, tenant_id, branch_id, requested_by, status) VALUES ($1,$2,$3,$4,'DRAFT')`,[id, tenantId, branchId, requestedBy]);
  for(const l of lines) await pool.query(`INSERT INTO purchase_request_lines (id, tenant_id, request_id, item_id, qty) VALUES ($1,$2,$3,$4,$5)`,[crypto.randomUUID(), tenantId, id, l.itemId, l.qty]);
  return {id};
}
export async function approvePurchaseRequest(tenantId:string, requestId:string): Promise<void>{ await getPool().query(`UPDATE purchase_requests SET status='APPROVED' WHERE id=$1 AND tenant_id=$2`,[requestId, tenantId]); }
