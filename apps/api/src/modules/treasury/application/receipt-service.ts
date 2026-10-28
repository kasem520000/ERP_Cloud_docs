import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { postJournal } from '../../accounting/application/posting-service.js';
export async function createReceipt(tenantId:string, input:{ cashAccountId:string; partnerId?:string; amount:string; currency?:string; exchangeRate?:string; valueDate:string; description?:string }): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); await pool.query(`INSERT INTO receipts (id, tenant_id, cash_account_id, partner_id, amount, currency_code, exchange_rate, value_date, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[id,tenantId,input.cashAccountId,input.partnerId??null,input.amount,input.currency??'SAR',input.exchangeRate??'1',input.valueDate,input.description??null]); return {id};
}
export async function postReceipt(tenantId:string, id:string, baseCurrency='SAR'): Promise<{journalId:string}>{
  const pool=getPool(); const r=await pool.query(`SELECT * FROM receipts WHERE id=$1 AND tenant_id=$2`,[id,tenantId]); if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const rec=r.rows[0] as { amount:string; currency_code:string; exchange_rate:string; value_date:string; partner_id:string|null; cash_account_id:string; status:string };
  if(rec.status==='POSTED') throw Object.assign(new Error('ALREADY_POSTED'),{status:409});
  // allocations check INV-016: sum allocations <= amount
  const alloc=await pool.query(`SELECT COALESCE(SUM(amount::numeric),0)::text AS tot FROM treasury_allocations WHERE tenant_id=$1 AND source_type='receipt' AND source_id=$2`,[tenantId,id]);
  const tot=(alloc.rows[0] as {tot:string}).tot; if(Number(tot) > Number(rec.amount)) throw Object.assign(new Error('INV-016: allocated exceeds amount'),{status:400});
  const res=await postJournal(tenantId, baseCurrency, { entryDate: rec.value_date, currency: rec.currency_code, exchangeRate: rec.exchange_rate, description:`Receipt ${id}`, lines:[{purpose:'CASH', direction:'debit', amount:rec.amount, partnerId: rec.partner_id ?? undefined},{purpose:'AR_CONTROL', direction:'credit', amount:rec.amount, partnerId: rec.partner_id ?? undefined}], source:{docType:'receipt', docId:id, operation:'POST'}});
  await pool.query(`UPDATE receipts SET status='POSTED', posted_journal_id=$1, posted_at=now() WHERE id=$2`,[res.id,id]);
  await pool.query(`INSERT INTO cash_movements (id, tenant_id, cash_account_id, direction, amount, currency_code, source_type, source_id, value_date) VALUES ($1,$2,$3,'IN',$4,$5,'receipt',$6,$7)`,[crypto.randomUUID(),tenantId,rec.cash_account_id,rec.amount,rec.currency_code,id,rec.value_date]);
  return {journalId: res.id};
}
export async function reverseReceipt(tenantId:string, id:string): Promise<void>{
  const pool=getPool(); const r=await pool.query(`SELECT posted_journal_id FROM receipts WHERE id=$1 AND tenant_id=$2`,[id,tenantId]); if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const { reverseJournal } = await import('../../accounting/application/reversal-service.js'); await reverseJournal(tenantId, (r.rows[0] as {posted_journal_id:string}).posted_journal_id, `reverse receipt ${id}`); await pool.query(`UPDATE receipts SET status='REVERSED' WHERE id=$1`,[id]);
}
