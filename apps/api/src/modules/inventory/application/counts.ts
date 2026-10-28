import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { postAdjustment } from './movement-service.js';
export async function createCount(tenantId:string, warehouseId:string, isBlind=false): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); await pool.query(`INSERT INTO stock_counts (id, tenant_id, warehouse_id, is_blind, snapshot_at, status) VALUES ($1,$2,$3,$4,now(),'DRAFT')`,[id, tenantId, warehouseId, isBlind]);
  // snapshot item_stock into count lines
  const stocks=await pool.query(`SELECT item_id, qty FROM item_stock WHERE tenant_id=$1 AND warehouse_id=$2`,[tenantId, warehouseId]);
  for(const row of stocks.rows as {item_id:string; qty:string}[]) await pool.query(`INSERT INTO stock_count_lines (id, tenant_id, count_id, item_id, system_qty) VALUES ($1,$2,$3,$4,$5)`,[crypto.randomUUID(), tenantId, id, row.item_id, row.qty]);
  return {id};
}
export async function submitCounts(tenantId:string, countId:string, lines:{ itemId:string; countedQty:string }[]): Promise<void>{
  const pool=getPool();
  for(const l of lines) await pool.query(`UPDATE stock_count_lines SET counted_qty=$1, variance_qty=($1::numeric - system_qty::numeric)::text WHERE count_id=$2 AND item_id=$3`,[l.countedQty, countId, l.itemId]);
  await pool.query(`UPDATE stock_counts SET status='VARIANCE_REVIEW' WHERE id=$1`,[countId]);
}
export async function approveCount(tenantId:string, countId:string, periodDate:string): Promise<void>{
  const pool=getPool(); const lines=await pool.query(`SELECT item_id, variance_qty FROM stock_count_lines WHERE count_id=$1 AND variance_qty IS NOT NULL AND variance_qty::numeric != 0`,[countId]);
  const warehouse=await pool.query(`SELECT warehouse_id FROM stock_counts WHERE id=$1`,[countId]);
  const whId=(warehouse.rows[0] as {warehouse_id:string}).warehouse_id;
  for(const row of lines.rows as {item_id:string; variance_qty:string}[]){
    const isLocked=await pool.query(`SELECT status FROM fiscal_periods WHERE tenant_id=$1 AND $2::date BETWEEN start_date AND end_date`,[tenantId, periodDate]);
    if(isLocked.rows.length && (isLocked.rows[0] as {status:string}).status==='LOCKED') throw Object.assign(new Error('PERIOD_LOCKED'),{status:409});
    await postAdjustment(tenantId,{ itemId: row.item_id, warehouseId: whId, qtyDiff: row.variance_qty, reason: Number(row.variance_qty)>0?'COUNT_GAIN':'COUNT_LOSS', valueDate: periodDate });
  }
  await pool.query(`UPDATE stock_counts SET status='POSTED' WHERE id=$1`,[countId]);
}
