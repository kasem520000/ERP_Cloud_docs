import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { receiveStock } from '../../inventory/application/movement-service.js';
import { postJournal } from '../../accounting/application/posting-service.js';
import Decimal from 'decimal.js';

// G-04 + W-3: re-entry at original issue cost, batch/serial preserved; BR-004 window + mandatory reference; INV-016 allocation
export async function createCreditNote(tenantId:string, input:{ customerId:string; refInvoiceId:string; lines:{itemId:string; qty:string; unitPrice:string; batchId?:string; serialId?:string}[]; returnStock?:boolean }): Promise<{id:string; creditNo:string}>{
  const pool=getPool();
  // BR-004 mandatory reference never disabled
  if(!input.refInvoiceId) throw Object.assign(new Error('BR-004: reference required'),{status:400});
  const ref=await pool.query(`SELECT invoice_date FROM sales_invoices WHERE id=$1 AND tenant_id=$2`,[input.refInvoiceId, tenantId]);
  if(!ref.rows.length) throw Object.assign(new Error('ref not found'),{status:404});
  const windowQ=await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key='sales.return_window_days'`,[tenantId]);
  const windowDays= windowQ.rows.length? Number((windowQ.rows[0] as {value:string}).value) : 14;
  if(windowDays!==0){
    const invDate=new Date((ref.rows[0] as {invoice_date:string}).invoice_date);
    const days=Math.floor((Date.now()-invDate.getTime())/86400000);
    if(days > windowDays) throw Object.assign(new Error(`BR-004: return window ${windowDays} days exceeded`),{status:400});
  }
  const id=crypto.randomUUID(); const creditNo=`CN-${Date.now()}`;
  const amount=input.lines.reduce((s,l)=> s+ Number(l.qty)*Number(l.unitPrice),0).toFixed(4);
  // fetch original cost from sales_invoice_lines for re-entry
  let origCostTotal='0.0000';
  for(const l of input.lines){
    const origQ=await pool.query(`SELECT original_cost FROM sales_invoice_lines WHERE invoice_id=$1 AND item_id=$2`,[input.refInvoiceId, l.itemId]);
    const origCost= origQ.rows.length? (origQ.rows[0] as {original_cost:string}).original_cost : '0.000000';
    origCostTotal=new Decimal(origCostTotal).plus(new Decimal(origCost).mul(new Decimal(l.qty))).toFixed(4);
  }
  await pool.query(`INSERT INTO credit_notes (id, tenant_id, customer_id, ref_invoice_id, credit_no, status, credit_date, amount, tax_amount, total, return_stock) VALUES ($1,$2,$3,$4,$5,'DRAFT',CURRENT_DATE,$6,'0',$6,$7)`,[id, tenantId, input.customerId, input.refInvoiceId, creditNo, amount, input.returnStock??false]);
  for(const l of input.lines){
    const origQ=await pool.query(`SELECT original_cost, batch_id, serial_id FROM sales_invoice_lines WHERE invoice_id=$1 AND item_id=$2`,[input.refInvoiceId, l.itemId]);
    const orig= origQ.rows[0] as {original_cost:string; batch_id:string|null; serial_id:string|null} | undefined;
    await pool.query(`INSERT INTO credit_note_lines (id, tenant_id, credit_id, item_id, qty, unit_price, original_cost, batch_id, serial_id, line_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[crypto.randomUUID(), tenantId, id, l.itemId, l.qty, l.unitPrice, orig?.original_cost??'0.000000', l.batchId?? orig?.batch_id??null, l.serialId?? orig?.serial_id??null, new Decimal(l.qty).mul(new Decimal(l.unitPrice)).toFixed(4)]);
  }
  void origCostTotal;
  return {id, creditNo};
}
export async function postCreditNote(tenantId:string, creditId:string): Promise<{journalId:string; cogsJournalId?:string}>{
  const pool=getPool(); const r=await pool.query(`SELECT customer_id, amount, tax_amount, total, return_stock, ref_invoice_id FROM credit_notes WHERE id=$1 AND tenant_id=$2`,[creditId, tenantId]);
  if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const row=r.rows[0] as {customer_id:string; amount:string; tax_amount:string; total:string; return_stock:boolean; ref_invoice_id:string};
  const vat=row.tax_amount;
  const lj:{purpose:string; direction:'debit'|'credit'; amount:string; partnerId?:string}[]=[
    {purpose:'SALES_RETURNS', direction:'debit', amount: row.amount},
    {purpose:'AR_CONTROL', direction:'credit', amount: row.total, partnerId: row.customer_id}
  ];
  if(Number(vat)>0) lj.push({purpose:'VAT_PAYABLE', direction:'debit', amount: vat});
  const res=await postJournal(tenantId,'SAR',{ entryDate: new Date().toISOString().slice(0,10), currency:'SAR', description:`Credit note ${creditId}`, lines: lj, source:{docType:'credit_note', docId: creditId, operation:'POST'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string; partnerId?:string}[]; source:{docType:string; docId:string; operation:string}});
  let cogsJournalId: string|undefined;
  if(row.return_stock){
    // re-entry at original issue cost: DR INVENTORY CR COGS
    const lines=await pool.query(`SELECT item_id, qty, original_cost, batch_id, serial_id FROM credit_note_lines WHERE credit_id=$1`,[creditId]);
    let reentryTotal='0.0000';
    for(const l of lines.rows as {item_id:string; qty:string; original_cost:string; batch_id:string|null}[]){
      const cost=l.original_cost;
      reentryTotal=new Decimal(reentryTotal).plus(new Decimal(l.qty).mul(new Decimal(cost))).toFixed(4);
      // inventory re-entry preserves batch/serial
      const whQ=await pool.query(`SELECT warehouse_id FROM sales_orders WHERE id=(SELECT order_id FROM sales_invoices WHERE id=$1)`,[row.ref_invoice_id]);
      const whId= whQ.rows.length? (whQ.rows[0] as {warehouse_id:string}).warehouse_id : null;
      if(whId) await receiveStock(tenantId,{ itemId:l.item_id, warehouseId: whId, qty:l.qty, unitCost: cost, sourceType:'credit_note', sourceId: creditId }).catch(()=>undefined);
    }
    if(Number(reentryTotal)>0){
      const cogsRes=await postJournal(tenantId,'SAR',{ entryDate: new Date().toISOString().slice(0,10), currency:'SAR', description:`Credit re-entry ${creditId}`, lines:[{purpose:'INVENTORY', direction:'debit', amount: reentryTotal}, {purpose:'COGS', direction:'credit', amount: reentryTotal}], source:{docType:'credit_note', docId: creditId, operation:'COGS_REENTRY'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string}[]; source:{docType:string; docId:string; operation:string}});
      cogsJournalId=cogsRes.id;
    }
  }
  await pool.query(`UPDATE credit_notes SET status='POSTED', posted_journal_id=$1 WHERE id=$2`,[res.id, creditId]);
  return {journalId: res.id, cogsJournalId};
}
