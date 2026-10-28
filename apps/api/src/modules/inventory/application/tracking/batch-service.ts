import { getPool } from '../../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function createBatch(tenantId:string, itemId:string, batchNo:string, expiryDate?:string): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); await pool.query(`INSERT INTO item_batches (id, tenant_id, item_id, batch_no, expiry_date) VALUES ($1,$2,$3,$4,$5)`,[id, tenantId, itemId, batchNo, expiryDate??null]); return {id};
}
export async function getFefoBatches(tenantId:string, itemId:string): Promise<{id:string; expiry_date:string|null}[]>{
  const pool=getPool(); const r=await pool.query(`SELECT id, expiry_date FROM item_batches WHERE tenant_id=$1 AND item_id=$2 ORDER BY expiry_date ASC NULLS LAST`,[tenantId, itemId]); return r.rows as {id:string; expiry_date:string|null}[];
}
