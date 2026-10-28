import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto'; import { postJournal } from '../../accounting/application/posting-service.js';
export async function createTransfer(tenantId:string, input:{ fromAccountId:string; toAccountId:string; amount:string; feeAmount?:string; valueDate:string; description?:string }): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); await pool.query(`INSERT INTO cash_transfers (id, tenant_id, from_account_id, to_account_id, amount, fee_amount, value_date, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[id,tenantId,input.fromAccountId,input.toAccountId,input.amount,input.feeAmount??'0',input.valueDate,input.description??null]); return {id};
}
export async function postTransfer(tenantId:string, id:string, baseCurrency='SAR'): Promise<{journalId:string}>{
  const pool=getPool(); const r=await pool.query(`SELECT * FROM cash_transfers WHERE id=$1 AND tenant_id=$2`,[id,tenantId]); if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const rec=r.rows[0] as { amount:string; fee_amount:string; value_date:string; from_account_id:string; to_account_id:string; status:string };
  if(rec.status==='POSTED') throw Object.assign(new Error('ALREADY_POSTED'),{status:409});
  const net=new (await import('decimal.js')).default(rec.amount).minus(new (await import('decimal.js')).default(rec.fee_amount)).toFixed(4);
  const lines:any[]=[{purpose:'CASH', direction:'debit', amount: net},{purpose:'BANK_CHARGES', direction:'debit', amount: rec.fee_amount},{purpose:'CASH', direction:'credit', amount: rec.amount}];
  const res=await postJournal(tenantId, baseCurrency, { entryDate: rec.value_date, currency:'SAR', description:`Transfer ${id}`, lines, source:{docType:'cash_transfer', docId:id, operation:'POST'}});
  await pool.query(`UPDATE cash_transfers SET status='POSTED', posted_journal_id=$1 WHERE id=$2`,[res.id,id]);
  await pool.query(`INSERT INTO cash_movements (id, tenant_id, cash_account_id, direction, amount, currency_code, source_type, source_id, value_date) VALUES ($1,$2,$3,'OUT',$4,'SAR','cash_transfer',$5,$6)`,[crypto.randomUUID(),tenantId,rec.from_account_id,rec.amount,id,rec.value_date]);
  await pool.query(`INSERT INTO cash_movements (id, tenant_id, cash_account_id, direction, amount, currency_code, source_type, source_id, value_date) VALUES ($1,$2,$3,'IN',$4,'SAR','cash_transfer',$5,$6)`,[crypto.randomUUID(),tenantId,rec.to_account_id,net,id,rec.value_date]);
  if(Number(rec.fee_amount)>0) await pool.query(`INSERT INTO cash_movements (id, tenant_id, cash_account_id, direction, amount, currency_code, source_type, source_id, value_date) VALUES ($1,$2,$3,'OUT',$4,'SAR','cash_transfer_fee',$5,$6)`,[crypto.randomUUID(),tenantId,rec.from_account_id,rec.fee_amount,id,rec.value_date]);
  return {journalId: res.id};
}
