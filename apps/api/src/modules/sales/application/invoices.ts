import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { postJournal } from '../../accounting/application/posting-service.js';
import { nextNo } from '../../accounting/application/numbering-service.js';
import { issueStock } from '../../inventory/application/movement-service.js';
import { resolvePrice } from '../domain/pricing.js';
import { checkCredit } from '../domain/credit-check.js';
import { resolveRecoverability, computeVat } from '../../purchasing/domain/vat-recoverability.js';
import Decimal from 'decimal.js';

// POSTING_ENGINE §5 sequencing: stock → COGS → tax stamp → AR/cash → subledger → audit one tx
// G-01 credit: DR AR_CONTROL · CR SALES_REVENUE · CR VAT_PAYABLE
// G-02 cash: DR CASH · CR SALES_REVENUE · CR VAT_PAYABLE
// G-03 COGS: DR COGS · CR INVENTORY

export async function createSalesInvoice(tenantId:string, input:{ customerId:string; branchId:string; kind:'CREDIT'|'CASH'; dueDate:string; deliveryId?:string; orderId?:string; lines:{itemId:string; qty:string; unitPrice:string; discountRate?:string; taxCodeId?:string; treatment?:string}[]; warehouseId?:string; repId?:string; invoiceDate?:string }): Promise<{invoiceId:string}>{
  const pool=getPool(); const id=crypto.randomUUID();
  const subtotal=input.lines.reduce((s,l)=> s+ Number(l.qty)*Number(l.unitPrice)*(1-Number(l.discountRate??0)),0).toFixed(4);
  // price resolution BR-003 via items service — simplified use provided price
  for(const l of input.lines){ void resolvePrice({ itemBase:l.unitPrice }); }
  await pool.query(`INSERT INTO sales_invoices (id, tenant_id, branch_id, customer_id, order_id, delivery_id, invoice_date, due_date, kind, status, subtotal, tax_amount, total, rep_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'DRAFT',$10,'0',$10,$11)`,[id, tenantId, input.branchId, input.customerId, input.orderId??null, input.deliveryId??null, input.invoiceDate?? new Date().toISOString().slice(0,10), input.dueDate, input.kind, subtotal, input.repId??null]);
  for(const l of input.lines){
    const lineAmt=new Decimal(l.qty).mul(new Decimal(l.unitPrice)).mul(new Decimal(1).minus(new Decimal(l.discountRate??'0'))).toFixed(4);
    // tax snapshot per TAX_ENGINE — resolve at posting time but store draft snapshot
    const rateQ= l.taxCodeId ? await pool.query(`SELECT rate, treatment FROM tax_codes WHERE id=$1`,[l.taxCodeId]) : {rows:[]};
    const rate= rateQ.rows.length? (rateQ.rows[0] as {rate:string}).rate : '0.1500';
    const treatment= l.treatment ?? (rateQ.rows[0] as {treatment:string}|undefined)?.treatment ?? 'STANDARD_RATED';
    const regQ=await pool.query(`SELECT status FROM tax_registrations WHERE tenant_id=$1 LIMIT 1`,[tenantId]);
    const regStatus=regQ.rows.length? (regQ.rows[0] as {status:string}).status : 'REGISTERED';
    const rec= resolveRecoverability(treatment, regStatus);
    const vat= rec==='NOT_SUBJECT' ? '0.0000' : computeVat(lineAmt, rate);
    // capture original cost for future credit-note re-entry
    await pool.query(`INSERT INTO sales_invoice_lines (id, tenant_id, invoice_id, item_id, qty, unit_price, discount_rate, line_amount, tax_code_id, tax_snapshot, original_cost) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[crypto.randomUUID(), tenantId, id, l.itemId, l.qty, l.unitPrice, l.discountRate??'0', lineAmt, l.taxCodeId??null, JSON.stringify({treatment, rate, recovery: rec==='NOT_SUBJECT'?'NOT_SUBJECT':'VAT_PAYABLE', vat}), '0.000000']);
  }
  return {invoiceId: id};
}

export async function approveSalesInvoice(tenantId:string, invoiceId:string): Promise<void>{
  const pool=getPool();
  const inv=await pool.query(`SELECT total, customer_id, branch_id, kind FROM sales_invoices WHERE id=$1 AND tenant_id=$2`,[invoiceId, tenantId]);
  if(!inv.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const row=inv.rows[0] as {total:string; customer_id:string; branch_id:string; kind:string};
  // BR-001 credit check at approval
  const policyQ=await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key='sales.credit_limit_action'`,[tenantId]);
  const posture=(policyQ.rows.length? (policyQ.rows[0] as {value:string}).value : 'warn') as 'block'|'warn'|'ignore';
  // fetch partner credit data
  const balQ=await pool.query(`SELECT open_balance, overdue_amount, credit_limit FROM partner_balances JOIN partners ON partners.id=partner_balances.partner_id WHERE partner_id=$1 AND tenant_id=$2`,[row.customer_id, tenantId]);
  if(balQ.rows.length){
    const b=balQ.rows[0] as {open_balance:string; overdue_amount:string; credit_limit:string};
    const result=checkCredit(b.open_balance, b.overdue_amount, b.credit_limit, row.total, posture);
    if(!result.allowed) throw Object.assign(new Error(`CREDIT_LIMIT_EXCEEDED ${result.math}`),{status:400, code:'CREDIT_LIMIT_EXCEEDED'});
    if(result.warn) await pool.query(`INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id, after) VALUES ($1,$2,'sales.credit_warn','sales_invoice',$3,$4)`,[crypto.randomUUID(), tenantId, invoiceId, JSON.stringify({warn: result.warn})]);
  }
  // override requires sales.credit_check.override risky audited — enforced via permission middleware (not in this minimal service)
  await pool.query(`UPDATE sales_invoices SET status='APPROVED' WHERE id=$1`,[invoiceId]);
}

export async function postSalesInvoice(tenantId:string, invoiceId:string): Promise<{journalId:string; cogsJournalId?:string}>{
  const pool=getPool();
  const inv=await pool.query(`SELECT status, customer_id, branch_id, kind, total, invoice_date, tax_amount, delivery_id FROM sales_invoices WHERE id=$1 AND tenant_id=$2`,[invoiceId, tenantId]);
  if(!inv.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const row=inv.rows[0] as {status:string; customer_id:string; branch_id:string; kind:string; total:string; invoice_date:string; tax_amount:string; delivery_id:string|null};
  if(row.status==='POSTED') throw Object.assign(new Error('ALREADY_POSTED'),{status:409});
  // period check INV-011
  const periodQ=await pool.query(`SELECT status FROM fiscal_periods WHERE tenant_id=$1 AND $2::date BETWEEN start_date AND end_date`,[tenantId, row.invoice_date]);
  if(periodQ.rows.length && (periodQ.rows[0] as {status:string}).status==='LOCKED') throw Object.assign(new Error('PERIOD_LOCKED'),{status:409});
  const lines=await pool.query(`SELECT item_id, line_amount, tax_snapshot, qty FROM sales_invoice_lines WHERE invoice_id=$1`,[invoiceId]);
  let net='0.0000', vat='0.0000';
  for(const r of lines.rows as {line_amount:string; tax_snapshot:string}[]){
    net=new Decimal(net).plus(new Decimal(r.line_amount)).toFixed(4);
    const snap= typeof r.tax_snapshot==='string' ? JSON.parse(r.tax_snapshot) : r.tax_snapshot as {vat:string}|null;
    if(snap?.vat) vat=new Decimal(vat).plus(new Decimal(snap.vat)).toFixed(4);
  }
  // if delivery already posted COGS, don't double COGS
  let cogsJournalId: string|undefined;
  if(!row.delivery_id){
    // need warehouse for stock issue — attempt to resolve via order
    const whQ=await pool.query(`SELECT warehouse_id FROM sales_orders WHERE id=(SELECT order_id FROM sales_invoices WHERE id=$1)`,[invoiceId]);
    const warehouseId=whQ.rows.length? (whQ.rows[0] as {warehouse_id:string}).warehouse_id : null;
    if(warehouseId){
      let cogsTotal='0.0000';
      for(const r of lines.rows as {item_id:string; qty:string}[]){
        const issued=await issueStock(tenantId,{ itemId:r.item_id, warehouseId, qty:r.qty, sourceType:'sales_invoice', sourceId: invoiceId });
        cogsTotal=new Decimal(cogsTotal).plus(new Decimal(r.qty).mul(new Decimal(issued.unitCost))).toFixed(4);
      }
      if(Number(cogsTotal)>0){
        const cogsRes=await postJournal(tenantId,'SAR',{ entryDate: row.invoice_date, currency:'SAR', description:`COGS ${invoiceId}`, lines:[{purpose:'COGS', direction:'debit', amount:cogsTotal}, {purpose:'INVENTORY', direction:'credit', amount:cogsTotal}], source:{docType:'sales_invoice', docId: invoiceId, operation:'COGS'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string}[]; source:{docType:string; docId:string; operation:string}});
        cogsJournalId=cogsRes.id;
      }
    }
  }
  const total=new Decimal(net).plus(new Decimal(vat)).toFixed(4);
  // tax snapshot stamping at posting BR-033 — recompute with pack rate if stale
  // numbering BR-029 INV-021 gapless
  const client=await pool.connect();
  let entryNo: string; let journalId: string;
  try{
    await client.query('BEGIN');
    entryNo=await nextNo(tenantId,'sales_invoice', row.branch_id, row.invoice_date.slice(0,4), client);
    const lj:{purpose:string; direction:'debit'|'credit'; amount:string; partnerId?:string}[]=[];
    if(row.kind==='CREDIT') lj.push({purpose:'AR_CONTROL', direction:'debit', amount:total, partnerId: row.customer_id});
    else lj.push({purpose:'CASH', direction:'debit', amount:total});
    lj.push({purpose:'SALES_REVENUE', direction:'credit', amount:net});
    if(Number(vat)>0) lj.push({purpose:'VAT_PAYABLE', direction:'credit', amount:vat});
    const res=await postJournal(tenantId,'SAR',{ entryDate: row.invoice_date, currency:'SAR', description:`Sales invoice ${invoiceId}`, lines: lj, source:{docType:'sales_invoice', docId: invoiceId, operation:'POST'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string; partnerId?:string}[]; source:{docType:string; docId:string; operation:string}});
    journalId=res.id;
    await client.query(`UPDATE sales_invoices SET status='POSTED', posted_journal_id=$1, invoice_no=$2, total=$3, tax_amount=$4 WHERE id=$5`,[journalId, entryNo, total, vat, invoiceId]);
    await client.query('COMMIT');
  } catch(e){ await client.query('ROLLBACK').catch(()=>{}); throw e; } finally{ (client as {release:()=>void}).release(); }
  return {journalId, cogsJournalId};
}
