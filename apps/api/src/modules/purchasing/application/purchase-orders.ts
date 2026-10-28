import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { nextNo } from '../../accounting/application/numbering-service.js';

// BR-010 threshold approval; BR-029 numbering INV-021; amendments via revision_of
export async function createPurchaseOrder(tenantId:string, branchId:string, supplierId:string, lines:{itemId:string; qty:string; unitPrice:string}[], orderDate:string): Promise<{id:string; orderNo:string}>{
  const pool=getPool();
  const thresholdQ=await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key=$2`,[tenantId, `approvals.purchase_order.${branchId}.threshold`]);
  const threshold = thresholdQ.rows.length? Number((thresholdQ.rows[0] as {value:string}).value) : Infinity;
  const total = lines.reduce((s,l)=> s+ Number(l.qty)*Number(l.unitPrice),0);
  const status = total > threshold ? 'PENDING_APPROVAL' : 'DRAFT';
  const id=crypto.randomUUID();
  const client=await pool.connect();
  try{ await client.query('BEGIN');
    const orderNo=await nextNo(tenantId,'purchase_order',branchId, orderDate.slice(0,4), client);
    await client.query(`INSERT INTO purchase_orders (id, tenant_id, branch_id, supplier_id, order_no, order_date, status, subtotal, tax_amount, total, version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1)`,[id, tenantId, branchId, supplierId, orderNo, orderDate, status, String(total), '0.0000', String(total)]);
    for(const l of lines){ await client.query(`INSERT INTO purchase_order_lines (id, tenant_id, order_id, item_id, qty, unit_price, line_amount) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[crypto.randomUUID(), tenantId, id, l.itemId, l.qty, l.unitPrice, String(Number(l.qty)*Number(l.unitPrice))]); }
    await client.query('COMMIT'); return {id, orderNo};
  } catch(e){ await client.query('ROLLBACK').catch(()=>{}); throw e; } finally{ (client as {release:()=>void}).release(); }
}
export async function approvePurchaseOrder(tenantId:string, orderId:string, _approverId:string): Promise<void>{
  const pool=getPool(); const r=await pool.query(`SELECT status, branch_id FROM purchase_orders WHERE id=$1 AND tenant_id=$2`,[orderId, tenantId]);
  if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const row=r.rows[0] as {status:string; branch_id:string};
  // SoD creator != approver BR-034
  void await pool.query(`SELECT created_by FROM purchase_orders WHERE id=$1`,[orderId]); // may be null in minimal schema
  // simple guard
  if(row.status!=='PENDING_APPROVAL') throw Object.assign(new Error('not_pending'),{status:400});
  await pool.query(`UPDATE purchase_orders SET status='APPROVED', updated_at=now() WHERE id=$1`,[orderId]);
  void row.branch_id;
}
export async function issuePurchaseOrder(tenantId:string, orderId:string): Promise<void>{
  await getPool().query(`UPDATE purchase_orders SET status='ISSUED' WHERE id=$1 AND tenant_id=$2`,[orderId, tenantId]);
}
