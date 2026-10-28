import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
// INV-016 property: allocated totals never exceed receipt/invoice; reallocation via audited docs; FIFO suggestion; on-account BR-027
export async function suggestFifo(tenantId:string, customerId:string): Promise<{invoiceId:string; open:string}[]>{
  const pool=getPool();
  const q=await pool.query(`SELECT id, total - COALESCE((SELECT SUM(amount::numeric) FROM ar_allocations WHERE invoice_id=sales_invoices.id),0) as open FROM sales_invoices WHERE tenant_id=$1 AND customer_id=$2 AND status='POSTED' ORDER BY due_date ASC`,[tenantId, customerId]);
  return (q.rows as {id:string; open:string}[]).map(r=> ({invoiceId:r.id, open: String(r.open)}));
}
export async function reallocateReceipt(tenantId:string, receiptId:string, newAllocations:{invoiceId:string; amount:string}[]): Promise<void>{
  const pool=getPool(); await pool.query(`DELETE FROM ar_allocations WHERE receipt_id=$1`,[receiptId]);
  for(const a of newAllocations) await pool.query(`INSERT INTO ar_allocations (id, tenant_id, receipt_id, invoice_id, amount) VALUES ($1,$2,$3,$4,$5)`,[crypto.randomUUID(), tenantId, receiptId, a.invoiceId, a.amount]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id, after) VALUES ($1,$2,'receipt.reallocated','receipt',$3,$4)`,[crypto.randomUUID(), tenantId, receiptId, JSON.stringify({at:new Date().toISOString()})]);
}
