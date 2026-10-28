import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { issueStock, receiveStock } from './movement-service.js';
export async function createTransfer(tenantId:string, fromWarehouseId:string, toWarehouseId:string, lines:{ itemId:string; qty:string }[]): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); await pool.query(`INSERT INTO stock_transfers (id, tenant_id, from_warehouse_id, to_warehouse_id, status) VALUES ($1,$2,$3,$4,'DRAFT')`,[id, tenantId, fromWarehouseId, toWarehouseId]);
  for(const l of lines) await pool.query(`INSERT INTO stock_transfer_lines (id, tenant_id, transfer_id, item_id, qty) VALUES ($1,$2,$3,$4,$5)`,[crypto.randomUUID(), tenantId, id, l.itemId, l.qty]);
  return {id};
}
export async function dispatchTransfer(tenantId:string, transferId:string): Promise<void>{
  const pool=getPool(); const transfer=await pool.query(`SELECT from_warehouse_id FROM stock_transfers WHERE id=$1 AND tenant_id=$2`,[transferId, tenantId]);
  if(!transfer.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const lines=await pool.query(`SELECT item_id, qty FROM stock_transfer_lines WHERE transfer_id=$1`,[transferId]);
  for(const row of lines.rows as {item_id:string; qty:string}[]) await issueStock(tenantId,{ itemId: row.item_id, warehouseId: (transfer.rows[0] as {from_warehouse_id:string}).from_warehouse_id, qty: row.qty, sourceType:'stock_transfer', sourceId: transferId });
  await pool.query(`UPDATE stock_transfers SET status='IN_TRANSIT', updated_at=now() WHERE id=$1`,[transferId]);
}
export async function receiveTransfer(tenantId:string, transferId:string): Promise<void>{
  const pool=getPool(); const transfer=await pool.query(`SELECT to_warehouse_id FROM stock_transfers WHERE id=$1 AND tenant_id=$2`,[transferId, tenantId]);
  const lines=await pool.query(`SELECT item_id, qty FROM stock_transfer_lines WHERE transfer_id=$1`,[transferId]);
  for(const row of lines.rows as {item_id:string; qty:string}[]) await receiveStock(tenantId,{ itemId: row.item_id, warehouseId: (transfer.rows[0] as {to_warehouse_id:string}).to_warehouse_id, qty: row.qty, unitCost:'0.000000', sourceType:'stock_transfer', sourceId: transferId });
  // journal only if branches map distinct inventory accounts (simplified: skip)
  await pool.query(`UPDATE stock_transfers SET status='POSTED', updated_at=now() WHERE id=$1`,[transferId]);
}
