import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { receiveStock } from '../../inventory/application/movement-service.js';
import { postJournal } from '../../accounting/application/posting-service.js';
import Decimal from 'decimal.js';

// G-07 GRN: DR INVENTORY Q×U · CR GRNI Q×U ; BR-012 PO-less
export async function createGoodsReceipt(tenantId:string, input:{ poId?:string; warehouseId:string; lines:{itemId:string; qty:string; unitCost:string; batchId?:string}[]; receiptDate:string; notes?:string }): Promise<{id:string}>{
  const pool=getPool();
  if(!input.poId){
    const allowQ=await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key='purchasing.allow_po_less_grn'`,[tenantId]);
    const allowed = !allowQ.rows.length || (allowQ.rows[0] as {value:string}).value!=='false';
    if(!allowed) throw Object.assign(new Error('BR-012: PO-less GRN forbidden'),{status:403});
    if(!input.notes) throw Object.assign(new Error('BR-012: reason required'),{status:400});
  }
  const id=crypto.randomUUID(); await pool.query(`INSERT INTO goods_receipts (id, tenant_id, po_id, warehouse_id, receipt_no, status, receipt_date, notes) VALUES ($1,$2,$3,$4,$5,'DRAFT',$6,$7)`,[id, tenantId, input.poId??null, input.warehouseId, `GRN-${Date.now()}`, input.receiptDate, input.notes??null]);
  for(const l of input.lines) await pool.query(`INSERT INTO goods_receipt_lines (id, tenant_id, receipt_id, item_id, qty, unit_cost, line_amount, batch_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[crypto.randomUUID(), tenantId, id, l.itemId, l.qty, l.unitCost, new Decimal(l.qty).mul(new Decimal(l.unitCost)).toFixed(4), l.batchId??null]);
  return {id};
}
export async function postGoodsReceipt(tenantId:string, receiptId:string): Promise<{journalId:string}>{
  const pool=getPool();
  const receipt=await pool.query(`SELECT warehouse_id, status FROM goods_receipts WHERE id=$1 AND tenant_id=$2`,[receiptId, tenantId]);
  if(!receipt.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  if((receipt.rows[0] as {status:string}).status==='POSTED') throw Object.assign(new Error('ALREADY_POSTED'),{status:409});
  const lines=await pool.query(`SELECT item_id, qty, unit_cost FROM goods_receipt_lines WHERE receipt_id=$1`,[receiptId]);
  const warehouseId=(receipt.rows[0] as {warehouse_id:string}).warehouse_id;
  let total='0.0000';
  for(const row of lines.rows as {item_id:string; qty:string; unit_cost:string}[]){
    const lineAmt=new Decimal(row.qty).mul(new Decimal(row.unit_cost)).toFixed(4);
    total=new Decimal(total).plus(new Decimal(lineAmt)).toFixed(4);
    await receiveStock(tenantId,{ itemId: row.item_id, warehouseId, qty: row.qty, unitCost: row.unit_cost, sourceType:'goods_receipt', sourceId: receiptId });
  }
  // G-07 posting DR INVENTORY · CR GRNI
  const res=await postJournal(tenantId,'SAR',{ entryDate: new Date().toISOString().slice(0,10), currency:'SAR', description:`GRN ${receiptId}`, lines:[{purpose:'INVENTORY', direction:'debit', amount: total}, {purpose:'GRNI', direction:'credit', amount: total}], source:{docType:'goods_receipt', docId: receiptId, operation:'POST'}} as unknown as {entryDate:string; currency:string; description?:string; lines:{purpose?:string; direction:'debit'|'credit'; amount:string}[]; source:{docType:string; docId:string; operation:string}});
  await pool.query(`UPDATE goods_receipts SET status='POSTED', posted_journal_id=$1 WHERE id=$2`,[res.id, receiptId]);
  return {journalId: res.id};
}
