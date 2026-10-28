import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function checkInv010(tenantId:string): Promise<{status:'OK'|'BROKEN'; offending?:string}>{
  const pool=getPool();
  const moves=await pool.query(`SELECT item_id, SUM(CASE WHEN direction='IN' THEN qty::numeric ELSE -qty::numeric END)::text AS qty FROM stock_moves WHERE tenant_id=$1 GROUP BY item_id`,[tenantId]);
  for(const row of moves.rows as {item_id:string; qty:string}[]){
    const stockQ=await pool.query(`SELECT COALESCE(SUM(qty::numeric),0)::text AS qty FROM item_stock WHERE tenant_id=$1 AND item_id=$2`,[tenantId, row.item_id]);
    const stockQty=(stockQ.rows[0] as {qty:string}).qty;
    if(stockQty!==row.qty) return {status:'BROKEN', offending: row.item_id};
  }
  await pool.query(`INSERT INTO reconciliation_runs (id, tenant_id, check_key, status, details) VALUES ($1,$2,'inv_010','PASSED',$3)`,[crypto.randomUUID(), tenantId, JSON.stringify({ok:true})]);
  return {status:'OK'};
}
