import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { postJournal } from '../../accounting/application/posting-service.js';
import Decimal from 'decimal.js';

// G-05 receipt: DR CASH CR AR_CONTROL; G-06 FX gain/loss; INV-016 allocations; on-account BR-027
export async function createReceipt(tenantId:string, input:{ customerId:string; cashAccountId:string; amount:string; method?:string; currency?:string; exchangeRate?:string; allocations:{invoiceId:string; amount:string}[]; valueDate:string }): Promise<{id:string}>{
  const pool=getPool();
  const allocSum=input.allocations.reduce((s,a)=> new Decimal(s).plus(new Decimal(a.amount)).toString(), '0');
  if(new Decimal(allocSum).gt(new Decimal(input.amount))) throw Object.assign(new Error('INV-016: allocation exceeds receipt'),{status:400});
  for(const a of input.allocations){
    const openQ=await pool.query(`SELECT total - COALESCE((SELECT SUM(amount::numeric) FROM ar_allocations WHERE invoice_id=$1),0) AS open FROM sales_invoices WHERE id=$2`,[a.invoiceId, a.invoiceId]);
    const open=openQ.rows.length? (openQ.rows[0] as {open:string}).open : '0.0000';
    if(new Decimal(a.amount).gt(new Decimal(open))) throw Object.assign(new Error('INV-016: allocation exceeds invoice open'),{status:400});
  }
  const id=crypto.randomUUID();
  await pool.query(`INSERT INTO receipts (id, tenant_id, receipt_no, cash_account_id, partner_id, amount, currency_code, exchange_rate, method, value_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'DRAFT')`,[id, tenantId, `REC-${Date.now()}`, input.cashAccountId, input.customerId, input.amount, input.currency??'SAR', input.exchangeRate??'1', input.method??'CASH', input.valueDate]);
  for(const a of input.allocations) await pool.query(`INSERT INTO ar_allocations (id, tenant_id, receipt_id, invoice_id, amount) VALUES ($1,$2,$3,$4,$5)`,[crypto.randomUUID(), tenantId, id, a.invoiceId, a.amount]);
  // on-account remainder visible as open amount not allocated
  return {id};
}
export async function postReceipt(tenantId:string, receiptId:string): Promise<{journalId:string}>{
  const pool=getPool(); const r=await pool.query(`SELECT partner_id, amount, cash_account_id, exchange_rate, currency_code, status FROM receipts WHERE id=$1 AND tenant_id=$2`,[receiptId, tenantId]);
  if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const row=r.rows[0] as {partner_id:string; amount:string; cash_account_id:string; exchange_rate:string; currency_code:string; status:string};
  if(row.status==='POSTED') throw Object.assign(new Error('ALREADY_POSTED'),{status:409});
  const lines:{purpose:string; direction:'debit'|'credit'; amount:string; partnerId?:string}[]=[
    {purpose:'CASH', direction:'debit', amount: row.amount},
    {purpose:'AR_CONTROL', direction:'credit', amount: row.amount, partnerId: row.partner_id}
  ];
  if(row.exchange_rate!=='1' && row.currency_code!=='SAR'){
    const diff=new Decimal(row.amount).mul(new Decimal(row.exchange_rate).minus(1)).toFixed(4);
    if(Number(diff)>0) lines.push({purpose:'FX_GAIN', direction:'credit', amount: diff});
    else if(Number(diff)<0) lines.push({purpose:'FX_LOSS', direction:'debit', amount: new Decimal(diff).abs().toFixed(4)});
  }
  const res=await postJournal(tenantId,'SAR',{ entryDate: new Date().toISOString().slice(0,10), currency: row.currency_code, exchangeRate: row.exchange_rate, description:`Receipt ${receiptId}`, lines, source:{docType:'receipt', docId: receiptId, operation:'POST'}} as unknown as {entryDate:string; currency:string; exchangeRate?:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string; partnerId?:string}[]; source:{docType:string; docId:string; operation:string}});
  await pool.query(`UPDATE receipts SET status='POSTED', posted_journal_id=$1 WHERE id=$2`,[res.id, receiptId]);
  return {journalId: res.id};
}
