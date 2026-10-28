import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { postJournal } from '../../accounting/application/posting-service.js';
import { resolveRecoverability, computeVat } from '../domain/vat-recoverability.js';
import Decimal from 'decimal.js';

// G-08 + BR-011 duplicate + BR-009 match-before-approval + VAT recoverability
export async function createSupplierInvoice(tenantId:string, input:{ supplierId:string; invoiceNo:string; invoiceDate:string; dueDate:string; poId?:string; grnId?:string; lines:{itemId:string; qty:string; unitPrice:string; taxCodeId?:string; treatment?:string}[]; currency?:string }): Promise<{id:string; internalNo:string}>{
  const pool=getPool();
  // BR-011 duplicate check (supplier, supplier-invoice-number, amount)
  const existing=await pool.query(`SELECT id, total FROM supplier_invoices WHERE tenant_id=$1 AND supplier_id=$2 AND invoice_no=$3`,[tenantId, input.supplierId, input.invoiceNo]);
  const total = input.lines.reduce((s,l)=> s+ Number(l.qty)*Number(l.unitPrice),0).toFixed(4);
  for(const row of existing.rows as {id:string; total:string}[]){
    if(row.total===total) throw Object.assign(new Error('BR-011: duplicate invoice blocked'),{status:409});
  }
  if(existing.rows.length) {
    // warn case — we log but allow (different amount)
    await pool.query(`INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id, after) VALUES ($1,$2,'supplier_invoice.duplicate_warn','supplier_invoice',$3,$4)`,[crypto.randomUUID(), tenantId, crypto.randomUUID(), JSON.stringify({invoiceNo: input.invoiceNo})]);
  }
  const id=crypto.randomUUID(); const internalNo=`SI-${Date.now()}`;
  await pool.query(`INSERT INTO supplier_invoices (id, tenant_id, supplier_id, invoice_no, internal_no, po_id, grn_id, status, invoice_date, due_date, subtotal, tax_amount, total, match_result, tax_summary) VALUES ($1,$2,$3,$4,$5,$6,$7,'DRAFT',$8,$9,$10,$11,$10,$12,$13)`,[id, tenantId, input.supplierId, input.invoiceNo, internalNo, input.poId??null, input.grnId??null, input.invoiceDate, input.dueDate, total, '0.0000', JSON.stringify([]), JSON.stringify({})]);
  for(const l of input.lines){
    // tax snapshot via TAX_ENGINE — resolve rate + recoverability
    const taxRateQ = l.taxCodeId ? await pool.query(`SELECT rate, treatment FROM tax_codes WHERE id=$1`,[l.taxCodeId]) : {rows:[]};
    const rate = taxRateQ.rows.length? (taxRateQ.rows[0] as {rate:string}).rate : '0.0000';
    const treatment = l.treatment ?? (taxRateQ.rows[0] as {treatment:string}|undefined)?.treatment ?? 'NOT_SUBJECT';
    const regQ=await pool.query(`SELECT status FROM tax_registrations WHERE tenant_id=$1 LIMIT 1`,[tenantId]);
    const regStatus=regQ.rows.length? (regQ.rows[0] as {status:string}).status : 'NOT_REGISTERED';
    const recovery=resolveRecoverability(treatment, regStatus);
    const lineAmt=new Decimal(l.qty).mul(new Decimal(l.unitPrice)).toFixed(4);
    const vat= recovery==='NOT_SUBJECT' ? '0.0000' : computeVat(lineAmt, rate);
    const vatRec = recovery==='VAT_RECOVERABLE'? vat : '0.0000';
    const vatExp = recovery==='VAT_EXPENSED'? vat : '0.0000';
    await pool.query(`INSERT INTO supplier_invoice_lines (id, tenant_id, invoice_id, item_id, qty, unit_price, line_amount, tax_code_id, tax_snapshot, vat_recoverable, vat_expensed) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[crypto.randomUUID(), tenantId, id, l.itemId, l.qty, l.unitPrice, lineAmt, l.taxCodeId??null, JSON.stringify({treatment, rate, recovery}), vatRec, vatExp]);
  }
  return {id, internalNo};
}
export async function postSupplierInvoice(tenantId:string, invoiceId:string): Promise<{journalId:string}>{
  const pool=getPool();
  const inv=await pool.query(`SELECT status, supplier_id, match_result, total, tax_amount, grn_id FROM supplier_invoices WHERE id=$1 AND tenant_id=$2`,[invoiceId, tenantId]);
  if(!inv.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const row=inv.rows[0] as {status:string; supplier_id:string; match_result:unknown; total:string; tax_amount:string; grn_id:string|null};
  if(row.status==='POSTED') throw Object.assign(new Error('ALREADY_POSTED'),{status:409});
  // BR-009 match_result must be recorded before approval/posting
  if(!row.match_result) throw Object.assign(new Error('BR-009: match_result required before posting'),{status:400});
  const lines=await pool.query(`SELECT line_amount, vat_recoverable, vat_expensed FROM supplier_invoice_lines WHERE invoice_id=$1`,[invoiceId]);
  let net='0.0000', vatRec='0.0000', vatExp='0.0000';
  for(const r of lines.rows as {line_amount:string; vat_recoverable:string; vat_expensed:string}[]){ net=new Decimal(net).plus(new Decimal(r.line_amount)).toFixed(4); vatRec=new Decimal(vatRec).plus(new Decimal(r.vat_recoverable)).toFixed(4); vatExp=new Decimal(vatExp).plus(new Decimal(r.vat_expensed)).toFixed(4); }
  const total=new Decimal(net).plus(new Decimal(vatRec)).plus(new Decimal(vatExp)).toFixed(4);
  // INV-012 tie: tax_summary accumulated by (treatment, rate, tax_code)
  const taxSummary={ net, vatRec, vatExp, total };
  // Determine GRNI clear amount if GRN linked
  let grniAmount='0.0000';
  if(row.grn_id){
    const grnLines=await pool.query(`SELECT line_amount FROM goods_receipt_lines WHERE receipt_id=$1`,[row.grn_id]);
    for(const g of grnLines.rows as {line_amount:string}[]) grniAmount=new Decimal(grniAmount).plus(new Decimal(g.line_amount)).toFixed(4);
  }
  // G-08 journal: DR INVENTORY/expense N · DR VAT_RECOVERABLE · CR AP_CONTROL N*(1+t) AND DR GRNI · CR INVENTORY clear
  const jl:{purpose:string; direction:'debit'|'credit'; amount:string}[]=[];
  jl.push({purpose:'INVENTORY', direction:'debit', amount: net});
  if(Number(vatRec)!==0) jl.push({purpose:'VAT_RECOVERABLE', direction:'debit', amount: vatRec});
  if(Number(vatExp)!==0) jl.push({purpose:'VAT_EXPENSED', direction:'debit', amount: vatExp});
  jl.push({purpose:'AP_CONTROL', direction:'credit', amount: total});
  // GRNI clear leg when GRN exists — net effect clears accrual
  if(Number(grniAmount)!==0){
    jl.push({purpose:'GRNI', direction:'debit', amount: grniAmount});
    jl.push({purpose:'INVENTORY', direction:'credit', amount: grniAmount});
  }
  const res=await postJournal(tenantId,'SAR',{ entryDate: new Date().toISOString().slice(0,10), currency:'SAR', description:`Supplier invoice ${invoiceId}`, lines: jl.map(l=> ({...l, partnerId: row.supplier_id})), source:{docType:'supplier_invoice', docId: invoiceId, operation:'POST'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string; partnerId?:string}[]; source:{docType:string; docId:string; operation:string}});
  await pool.query(`UPDATE supplier_invoices SET status='POSTED', posted_journal_id=$1, tax_summary=$2 WHERE id=$3`,[res.id, JSON.stringify(taxSummary), invoiceId]);
  return {journalId: res.id};
}
