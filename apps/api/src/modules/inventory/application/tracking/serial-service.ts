import { getPool } from '../../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function registerSerial(tenantId:string, itemId:string, serialNo:string): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); await pool.query(`INSERT INTO item_serials (id, tenant_id, item_id, serial_no, status) VALUES ($1,$2,$3,$4,'in_stock')`,[id, tenantId, itemId, serialNo]); return {id};
}
export async function sellSerial(tenantId:string, serialId:string): Promise<void>{ const pool=getPool(); await pool.query(`UPDATE item_serials SET status='sold' WHERE id=$1`,[serialId]); }
export async function returnSerial(tenantId:string, serialId:string, _originalSaleId:string): Promise<void>{
  const pool=getPool(); const r=await pool.query(`SELECT status FROM item_serials WHERE id=$1`,[serialId]); if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  if((r.rows[0] as {status:string}).status!=='sold') throw Object.assign(new Error('BR-018: must reference sold unit'),{status:400});
  await pool.query(`UPDATE item_serials SET status='returned' WHERE id=$1`,[serialId]);
}
