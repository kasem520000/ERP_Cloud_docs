import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import Decimal from 'decimal.js';

// BR-006 expired quote cannot be accepted/converted; valid_until enforced; default 30 days
export async function createQuotation(tenantId:string, branchId:string, customerId:string, lines:{itemId:string; qty:string; unitPrice:string}[], validUntil?:string): Promise<{id:string; quoteNo:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); const quoteNo=`QT-${Date.now()}`;
  const valid = validUntil ?? new Date(Date.now()+30*86400000).toISOString().slice(0,10);
  const total=lines.reduce((s,l)=> s+ Number(l.qty)*Number(l.unitPrice),0).toFixed(4);
  await pool.query(`INSERT INTO quotations (id, tenant_id, branch_id, customer_id, quote_no, status, valid_until, subtotal, total) VALUES ($1,$2,$3,$4,$5,'DRAFT',$6,$7,$7)`,[id, tenantId, branchId, customerId, quoteNo, valid, total]);
  for(const l of lines) await pool.query(`INSERT INTO quotation_lines (id, tenant_id, quote_id, item_id, qty, unit_price, line_amount) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[crypto.randomUUID(), tenantId, id, l.itemId, l.qty, l.unitPrice, new Decimal(l.qty).mul(new Decimal(l.unitPrice)).toFixed(4)]);
  return {id, quoteNo};
}
export async function sendQuotation(tenantId:string, quoteId:string): Promise<void>{
  await getPool().query(`UPDATE quotations SET status='SENT' WHERE id=$1 AND tenant_id=$2`,[quoteId, tenantId]);
}
export async function acceptQuotation(tenantId:string, quoteId:string): Promise<void>{
  const pool=getPool(); const r=await pool.query(`SELECT status, valid_until FROM quotations WHERE id=$1 AND tenant_id=$2`,[quoteId, tenantId]);
  if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const row=r.rows[0] as {status:string; valid_until:string};
  if(row.status==='EXPIRED') throw Object.assign(new Error('BR-006: expired quote cannot be accepted'),{status:400});
  if(new Date(row.valid_until) < new Date()) { await pool.query(`UPDATE quotations SET status='EXPIRED' WHERE id=$1`,[quoteId]); throw Object.assign(new Error('BR-006: quote expired'),{status:400}); }
  await pool.query(`UPDATE quotations SET status='ACCEPTED' WHERE id=$1`,[quoteId]);
}
export async function convertQuotation(tenantId:string, quoteId:string): Promise<{orderId:string}>{
  const pool=getPool(); const q=await pool.query(`SELECT status, valid_until, branch_id, customer_id FROM quotations WHERE id=$1 AND tenant_id=$2`,[quoteId, tenantId]);
  if(!q.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const row=q.rows[0] as {status:string; valid_until:string; branch_id:string; customer_id:string};
  if(new Date(row.valid_until) < new Date()) throw Object.assign(new Error('BR-006: expired quote cannot be converted'),{status:400});
  if(row.status!=='ACCEPTED' && row.status!=='SENT') throw Object.assign(new Error('must be SENT/ACCEPTED'),{status:400});
  // create sales order from quotation lines
  const lines=await pool.query(`SELECT item_id, qty, unit_price FROM quotation_lines WHERE quote_id=$1`,[quoteId]);
  const orderId=crypto.randomUUID();
  await pool.query(`INSERT INTO sales_orders (id, tenant_id, branch_id, customer_id, warehouse_id, order_no, status, subtotal, total) VALUES ($1,$2,$3,$4,$5,$6,'DRAFT',0,0)`,[orderId, tenantId, row.branch_id, row.customer_id, row.branch_id, `SO-${Date.now()}`]);
  for(const l of lines.rows as {item_id:string; qty:string; unit_price:string}[]) await pool.query(`INSERT INTO sales_order_lines (id, tenant_id, order_id, item_id, qty, unit_price, line_amount) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[crypto.randomUUID(), tenantId, orderId, l.item_id, l.qty, l.unit_price, new Decimal(l.qty).mul(new Decimal(l.unit_price)).toFixed(4)]);
  return {orderId};
}
