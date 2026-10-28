import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function reserveStock(tenantId:string, input:{ itemId:string; warehouseId:string; qty:string; holderType:string; holderId:string; ttlMinutes?:number }): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); const expires=new Date(Date.now()+(input.ttlMinutes??60)*60000).toISOString();
  await pool.query(`INSERT INTO stock_reservations (id, tenant_id, item_id, warehouse_id, qty, holder_type, holder_id, expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[id, tenantId, input.itemId, input.warehouseId, input.qty, input.holderType, input.holderId, expires]); return {id};
}
export async function releaseExpired(): Promise<number>{
  const pool=getPool(); const r=await pool.query(`UPDATE stock_reservations SET status='EXPIRED' WHERE expires_at < now() AND status='ACTIVE' RETURNING id`); return r.rows.length;
}
