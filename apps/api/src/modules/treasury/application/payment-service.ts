import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto'; import { postJournal } from '../../accounting/application/posting-service.js';
export async function createPayment(tenantId:string, input:{ cashAccountId:string; partnerId?:string; amount:string; currency?:string; exchangeRate?:string; valueDate:string; description?:string }): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); await pool.query(`INSERT INTO payments (id, tenant_id, cash_account_id, partner_id, amount, currency_code, exchange_rate, value_date, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[id,tenantId,input.cashAccountId,input.partnerId??null,input.amount,input.currency??'SAR',input.exchangeRate??'1',input.valueDate,input.description??null]); return {id};
}
export async function postPayment(tenantId:string, id:string, baseCurrency='SAR'): Promise<{journalId:string}>{
  const pool=getPool(); const r=await pool.query(`SELECT * FROM payments WHERE id=$1 AND tenant_id=$2`,[id,tenantId]); if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const rec=r.rows[0] as { amount:string; currency_code:string; exchange_rate:string; value_date:string; partner_id:string|null; cash_account_id:string; status:string };
  if(rec.status==='POSTED') throw Object.assign(new Error('ALREADY_POSTED'),{status:409});
  const alloc=await pool.query(`SELECT COALESCE(SUM(amount::numeric),0)::text AS tot FROM treasury_allocations WHERE tenant_id=$1 AND source_type='payment' AND source_id=$2`,[tenantId,id]);
  if(Number((alloc.rows[0] as {tot:string}).tot) > Number(rec.amount)) throw Object.assign(new Error('INV-016'),{status:400});
  const res=await postJournal(tenantId, baseCurrency, { entryDate: rec.value_date, currency: rec.currency_code, exchangeRate: rec.exchange_rate, description:`Payment ${id}`, lines:[{purpose:'AP_CONTROL', direction:'debit', amount:rec.amount, partnerId: rec.partner_id ?? undefined},{purpose:'CASH', direction:'credit', amount:rec.amount}], source:{docType:'payment', docId:id, operation:'POST'}});
  await pool.query(`UPDATE payments SET status='POSTED', posted_journal_id=$1 WHERE id=$2`,[res.id,id]);
  await pool.query(`INSERT INTO cash_movements (id, tenant_id, cash_account_id, direction, amount, currency_code, source_type, source_id, value_date) VALUES ($1,$2,$3,'OUT',$4,$5,'payment',$6,$7)`,[crypto.randomUUID(),tenantId,rec.cash_account_id,rec.amount,rec.currency_code,id,rec.value_date]);
  return {journalId: res.id};
}
