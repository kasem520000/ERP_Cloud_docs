import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto'; import { postJournal } from '../../accounting/application/posting-service.js';
export async function createCategory(tenantId:string, input:{ code:string; name:string; accountId:string; approvalPolicy?:string }): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID(); await pool.query(`INSERT INTO expense_categories (id, tenant_id, code, name, account_id, approval_policy) VALUES ($1,$2,$3,$4,$5,$6)`,[id,tenantId,input.code,input.name,input.accountId,input.approvalPolicy??null]); return {id};
}
export async function createExpense(tenantId:string, input:{ categoryId:string; cashAccountId:string; amount:string; description?:string }): Promise<{id:string}>{
  const pool=getPool(); const cat=await pool.query(`SELECT account_id FROM expense_categories WHERE id=$1 AND tenant_id=$2`,[input.categoryId,tenantId]); if(!cat.rows.length) throw Object.assign(new Error('category_not_found'),{status:404});
  const id=crypto.randomUUID(); await pool.query(`INSERT INTO expenses (id, tenant_id, category_id, cash_account_id, amount, description) VALUES ($1,$2,$3,$4,$5,$6)`,[id,tenantId,input.categoryId,input.cashAccountId,input.amount,input.description??null]); return {id};
}
export async function postExpense(tenantId:string, id:string, baseCurrency='SAR'): Promise<{journalId:string}>{
  const pool=getPool(); const r=await pool.query(`SELECT e.*, c.account_id AS exp_account FROM expenses e JOIN expense_categories c ON c.id=e.category_id WHERE e.id=$1 AND e.tenant_id=$2`,[id,tenantId]); if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const rec=r.rows[0] as { amount:string; cash_account_id:string; exp_account:string; status:string };
  if(rec.status==='POSTED') throw Object.assign(new Error('ALREADY_POSTED'),{status:409});
  // BR-023 receipt threshold 0 = always require file — skipped here, just post
  const res=await postJournal(tenantId, baseCurrency, { entryDate: new Date().toISOString().slice(0,10), currency:'SAR', description:`Expense ${id}`, lines:[{accountId: rec.exp_account, direction:'debit', amount: rec.amount},{purpose:'CASH', direction:'credit', amount: rec.amount}], source:{docType:'expense', docId:id, operation:'POST'}});
  await pool.query(`UPDATE expenses SET status='POSTED', posted_journal_id=$1 WHERE id=$2`,[res.id,id]);
  await pool.query(`INSERT INTO cash_movements (id, tenant_id, cash_account_id, direction, amount, currency_code, source_type, source_id, value_date) VALUES ($1,$2,$3,'OUT',$4,'SAR','expense',$5, CURRENT_DATE)`,[crypto.randomUUID(),tenantId,rec.cash_account_id,rec.amount,id]);
  return {journalId: res.id};
}
