import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { reserveStock } from '../../inventory/application/reservations.js';
import Decimal from 'decimal.js';

// Soft reservation expiry-honored non-blocking
export async function createSalesOrder(tenantId:string, branchId:string, customerId:string, warehouseId:string, lines:{itemId:string; qty:string; unitPrice:string}[], repId?:string): Promise<{id:string; orderNo:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); const orderNo=`SO-${Date.now()}`;
  const total=lines.reduce((s,l)=> s+ Number(l.qty)*Number(l.unitPrice),0).toFixed(4);
  await pool.query(`INSERT INTO sales_orders (id, tenant_id, branch_id, customer_id, warehouse_id, order_no, status, subtotal, total, rep_id, reservation_expires_at) VALUES ($1,$2,$3,$4,$5,$6,'DRAFT',$7,$7,$8,$9)`,[id, tenantId, branchId, customerId, warehouseId, orderNo, total, repId??null, new Date(Date.now()+60*60000).toISOString()]);
  for(const l of lines){
    await pool.query(`INSERT INTO sales_order_lines (id, tenant_id, order_id, item_id, qty, unit_price, line_amount) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[crypto.randomUUID(), tenantId, id, l.itemId, l.qty, l.unitPrice, new Decimal(l.qty).mul(new Decimal(l.unitPrice)).toFixed(4)]);
    // soft reservation non-blocking
    await reserveStock(tenantId,{ itemId:l.itemId, warehouseId, qty:l.qty, holderType:'sales_order', holderId:id, ttlMinutes:60 }).catch(()=>undefined);
  }
  return {id, orderNo};
}
export async function approveSalesOrder(tenantId:string, orderId:string): Promise<void>{
  await getPool().query(`UPDATE sales_orders SET status='APPROVED' WHERE id=$1 AND tenant_id=$2`,[orderId, tenantId]);
}
