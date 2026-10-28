import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto'; import { postJournal } from '../../accounting/application/posting-service.js';
export async function openShift(tenantId:string, input:{ cashAccountId:string; openingFloat:string; userId?:string }): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); await pool.query(`INSERT INTO cashier_shifts (id, tenant_id, cash_account_id, user_id, opening_float) VALUES ($1,$2,$3,$4,$5)`,[id,tenantId,input.cashAccountId,input.userId??null,input.openingFloat]); return {id};
}
export async function closeShift(tenantId:string, id:string, input:{ countedAmount:string; expectedAmount:string; supervisorPin?:string; reason?:string }): Promise<{journalId?:string}>{
  const pool=getPool(); const r=await pool.query(`SELECT cash_account_id, status FROM cashier_shifts WHERE id=$1 AND tenant_id=$2`,[id,tenantId]); if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const rec=r.rows[0] as {cash_account_id:string; status:string}; if(rec.status==='CLOSED') throw Object.assign(new Error('already_closed'),{status:409});
  const variance=(Number(input.countedAmount)-Number(input.expectedAmount)).toFixed(4);
  const tolerance=0; const needPin=Math.abs(Number(variance)) > tolerance;
  if(needPin && !input.supervisorPin) throw Object.assign(new Error('supervisor PIN required'),{status:403});
  if(needPin && !input.reason) throw Object.assign(new Error('reason required'),{status:400});
  let journalId: string|undefined;
  if(Math.abs(Number(variance))>0.0001){
    const res=await postJournal(tenantId,'SAR',{ entryDate: new Date().toISOString().slice(0,10), currency:'SAR', description:`Shift variance ${id}`, lines: Number(variance)<0 ? [{purpose:'CASH', direction:'debit', amount: Math.abs(Number(variance)).toFixed(4)},{accountId: (await pool.query(`SELECT account_id FROM cash_accounts WHERE id=$1`,[rec.cash_account_id])).rows[0]?.account_id ?? rec.cash_account_id, direction:'credit', amount: Math.abs(Number(variance)).toFixed(4)}] : [{accountId: (await pool.query(`SELECT account_id FROM cash_accounts WHERE id=$1`,[rec.cash_account_id])).rows[0]?.account_id ?? rec.cash_account_id, direction:'debit', amount: variance},{purpose:'CASH', direction:'credit', amount: variance}], source:{docType:'cashier_shift', docId:id, operation:'POST'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose?:string; accountId?:string; direction:'debit'|'credit'; amount:string}[]; source:{docType:string; docId:string; operation:string}});
    journalId=res.id;
    void (Number(variance)<0 ? 'OUT':'IN'); await pool.query(`INSERT INTO cash_movements (id, tenant_id, cash_account_id, direction, amount, currency_code, source_type, source_id, value_date) VALUES ($1,$2,$3,$4,$5,'SAR','cashier_shift',$6,CURRENT_DATE)`,[crypto.randomUUID(),tenantId,rec.cash_account_id,Math.abs(Number(variance)).toFixed(4),id]);
  }
  await pool.query(`UPDATE cashier_shifts SET status='CLOSED', counted_amount=$1, expected_amount=$2, variance=$3, closed_at=now(), variance_posted_journal_id=$4 WHERE id=$5`,[input.countedAmount,input.expectedAmount,variance,journalId??null,id]);
  return {journalId};
}
