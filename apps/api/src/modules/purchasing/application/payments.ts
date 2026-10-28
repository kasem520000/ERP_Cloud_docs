import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { postJournal } from '../../accounting/application/posting-service.js';
import Decimal from 'decimal.js';

// G-10 payment: DR AP_CONTROL · CR CASH (+ FX gain/loss); INV-016 allocation bounds; on-account; re-allocation audited
export async function createPayment(tenantId:string, input:{ supplierId:string; cashAccountId:string; amount:string; currency?:string; exchangeRate?:string; allocations:{invoiceId:string; amount:string}[]; valueDate:string }): Promise<{id:string}>{
  const pool=getPool();
  // INV-016: total allocated never exceeds payment amount
  const allocSum=input.allocations.reduce((s,a)=> new Decimal(s).plus(new Decimal(a.amount)).toFixed(4), '0.0000');
  if(new Decimal(allocSum).gt(new Decimal(input.amount))) throw Object.assign(new Error('INV-016: allocation exceeds payment'),{status:400});
  // INV-016: also check each invoice open amount
  for(const a of input.allocations){
    const openQ=await pool.query(`SELECT total - COALESCE((SELECT SUM(amount::numeric) FROM ap_allocations WHERE invoice_id=$1),0) AS open FROM supplier_invoices WHERE id=$2`,[a.invoiceId, a.invoiceId]);
    const open = openQ.rows.length? (openQ.rows[0] as {open:string}).open : '0.0000';
    if(new Decimal(a.amount).gt(new Decimal(open))) throw Object.assign(new Error('INV-016: allocation exceeds invoice open'),{status:400});
  }
  const id=crypto.randomUUID();
  await pool.query(`INSERT INTO payments (id, tenant_id, payment_no, cash_account_id, partner_id, amount, currency_code, exchange_rate, method, value_date, status, posted_journal_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'CASH',$9,'DRAFT',NULL)`,[id, tenantId, `PAY-${Date.now()}`, input.cashAccountId, input.supplierId, input.amount, input.currency??'SAR', input.exchangeRate??'1', input.valueDate]);
  for(const a of input.allocations) await pool.query(`INSERT INTO ap_allocations (id, tenant_id, payment_id, invoice_id, amount) VALUES ($1,$2,$3,$4,$5)`,[crypto.randomUUID(), tenantId, id, a.invoiceId, a.amount]);
  // on-account remainder implicit: amount - allocSum stays unallocated
  return {id};
}
export async function postPayment(tenantId:string, paymentId:string): Promise<{journalId:string}>{
  const pool=getPool(); const r=await pool.query(`SELECT partner_id, amount, cash_account_id, exchange_rate, currency_code, status FROM payments WHERE id=$1 AND tenant_id=$2`,[paymentId, tenantId]);
  if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const row=r.rows[0] as {partner_id:string; amount:string; cash_account_id:string; exchange_rate:string; currency_code:string; status:string};
  if(row.status==='POSTED') throw Object.assign(new Error('ALREADY_POSTED'),{status:409});
  // FX difference from RECEIVABLES_AND_PAYABLES — mirror G-06
  const lines:{purpose:string; direction:'debit'|'credit'; amount:string; partnerId?:string}[]=[
    {purpose:'AP_CONTROL', direction:'debit', amount: row.amount, partnerId: row.partner_id},
    {purpose:'CASH', direction:'credit', amount: row.amount}
  ];
  // if FX rate !=1 need gain/loss line (simplified)
  if(row.exchange_rate!=='1' && row.currency_code!=='SAR'){
    const diff=new Decimal(row.amount).mul(new Decimal(row.exchange_rate).minus(1)).toFixed(4);
    if(Number(diff)>0) lines.push({purpose:'FX_GAIN', direction:'credit', amount: diff});
    else if(Number(diff)<0) lines.push({purpose:'FX_LOSS', direction:'debit', amount: new Decimal(diff).abs().toFixed(4)});
  }
  const res=await postJournal(tenantId,'SAR',{ entryDate: new Date().toISOString().slice(0,10), currency: row.currency_code, exchangeRate: row.exchange_rate, description:`Payment ${paymentId}`, lines, source:{docType:'payment', docId: paymentId, operation:'POST'}} as unknown as {entryDate:string; currency:string; exchangeRate?:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string; partnerId?:string}[]; source:{docType:string; docId:string; operation:string}});
  await pool.query(`UPDATE payments SET status='POSTED', posted_journal_id=$1 WHERE id=$2`,[res.id, paymentId]);
  return {journalId: res.id};
}
export async function reallocatePayment(tenantId:string, paymentId:string, newAllocations:{invoiceId:string; amount:string}[]): Promise<void>{
  const pool=getPool(); await pool.query(`DELETE FROM ap_allocations WHERE payment_id=$1`,[paymentId]);
  for(const a of newAllocations) await pool.query(`INSERT INTO ap_allocations (id, tenant_id, payment_id, invoice_id, amount) VALUES ($1,$2,$3,$4,$5)`,[crypto.randomUUID(), tenantId, paymentId, a.invoiceId, a.amount]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id, after) VALUES ($1,$2,'payment.reallocated','payment',$3,$4)`,[crypto.randomUUID(), tenantId, paymentId, JSON.stringify({at:new Date().toISOString()})]);
}
