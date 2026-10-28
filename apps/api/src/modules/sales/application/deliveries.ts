import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { issueStock } from '../../inventory/application/movement-service.js';
import { postJournal } from '../../accounting/application/posting-service.js';
import Decimal from 'decimal.js';

// G-03 COGS: DR COGS · CR INVENTORY at issue cost; converts to invoice; BR-007 doc flow
export async function createDeliveryNote(tenantId:string, orderId:string, warehouseId:string, lines:{itemId:string; qty:string}[]): Promise<{id:string; deliveryNo:string}>{
  const pool=getPool();
  const order=await pool.query(`SELECT customer_id FROM sales_orders WHERE id=$1 AND tenant_id=$2`,[orderId, tenantId]);
  if(!order.rows.length) throw Object.assign(new Error('order not found'),{status:404});
  const customerId=(order.rows[0] as {customer_id:string}).customer_id;
  const id=crypto.randomUUID(); const deliveryNo=`DN-${Date.now()}`;
  await pool.query(`INSERT INTO delivery_notes (id, tenant_id, order_id, customer_id, warehouse_id, delivery_no, status, delivery_date) VALUES ($1,$2,$3,$4,$5,$6,'DRAFT',CURRENT_DATE)`,[id, tenantId, orderId, customerId, warehouseId, deliveryNo]);
  for(const l of lines) await pool.query(`INSERT INTO delivery_note_lines (id, tenant_id, delivery_id, item_id, qty, unit_cost, cogs_amount) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[crypto.randomUUID(), tenantId, id, l.itemId, l.qty, '0.000000', '0.0000']);
  return {id, deliveryNo};
}
export async function postDeliveryNote(tenantId:string, deliveryId:string): Promise<{cogsJournalId:string}>{
  const pool=getPool(); const dn=await pool.query(`SELECT warehouse_id, status FROM delivery_notes WHERE id=$1 AND tenant_id=$2`,[deliveryId, tenantId]);
  if(!dn.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  if((dn.rows[0] as {status:string}).status==='POSTED') throw Object.assign(new Error('ALREADY_POSTED'),{status:409});
  const warehouseId=(dn.rows[0] as {warehouse_id:string}).warehouse_id;
  const lines=await pool.query(`SELECT item_id, qty FROM delivery_note_lines WHERE delivery_id=$1`,[deliveryId]);
  let cogsTotal='0.0000';
  for(const r of lines.rows as {item_id:string; qty:string}[]){
    const issue=await issueStock(tenantId,{ itemId:r.item_id, warehouseId, qty:r.qty, sourceType:'delivery_note', sourceId: deliveryId });
    const cost=issue.unitCost; // at issue cost WAC/FIFO
    const amt=new Decimal(r.qty).mul(new Decimal(cost)).toFixed(4);
    cogsTotal=new Decimal(cogsTotal).plus(new Decimal(amt)).toFixed(4);
    await pool.query(`UPDATE delivery_note_lines SET unit_cost=$1, cogs_amount=$2 WHERE delivery_id=$3 AND item_id=$4`,[cost, amt, deliveryId, r.item_id]);
  }
  // G-03 posting
  const res=await postJournal(tenantId,'SAR',{ entryDate: new Date().toISOString().slice(0,10), currency:'SAR', description:`Delivery COGS ${deliveryId}`, lines:[{purpose:'COGS', direction:'debit', amount:cogsTotal}, {purpose:'INVENTORY', direction:'credit', amount:cogsTotal}], source:{docType:'delivery_note', docId: deliveryId, operation:'POST'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string}[]; source:{docType:string; docId:string; operation:string}});
  await pool.query(`UPDATE delivery_notes SET status='POSTED', cogs_journal_id=$1 WHERE id=$2`,[res.id, deliveryId]);
  return {cogsJournalId: res.id};
}
export async function convertToInvoice(tenantId:string, deliveryId:string, invoiceKind:'CREDIT'|'CASH', dueDate:string): Promise<{invoiceId:string}>{
  const pool=getPool(); const dn=await pool.query(`SELECT order_id, customer_id FROM delivery_notes WHERE id=$1`,[deliveryId]);
  if(!dn.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const { createSalesInvoice }=await import('./invoices.js');
  const orderId=(dn.rows[0] as {order_id:string}).order_id;
  const linesQ=await pool.query(`SELECT item_id, qty FROM delivery_note_lines WHERE delivery_id=$1`,[deliveryId]);
  const lines=(linesQ.rows as {item_id:string; qty:string}[]).map(r=> ({itemId:r.item_id, qty:r.qty, unitPrice:'0', discountRate:'0'}));
  // price will be resolved via sales order lines if exists
  return createSalesInvoice(tenantId,{ customerId:(dn.rows[0] as {customer_id:string}).customer_id, branchId: orderId, kind: invoiceKind, dueDate, deliveryId, orderId, lines });
}
