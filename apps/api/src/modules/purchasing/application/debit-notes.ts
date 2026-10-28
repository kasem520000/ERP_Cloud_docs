import { getPool } from '../../../infra/db/db.js'; import { postJournal } from '../../accounting/application/posting-service.js';
import crypto from 'node:crypto'; import Decimal from 'decimal.js';

// G-09 debit note mirror: DR AP_CONTROL · CR INVENTORY/expense · CR VAT_RECOVERABLE
export async function createDebitNote(tenantId:string, input:{ supplierId:string; refInvoiceId:string; amount:string; taxAmount?:string }): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID();
  const total=new Decimal(input.amount).plus(new Decimal(input.taxAmount??'0')).toFixed(4);
  await pool.query(`INSERT INTO debit_notes (id, tenant_id, supplier_id, ref_invoice_id, debit_no, status, debit_date, amount, tax_amount, total) VALUES ($1,$2,$3,$4,$5,'DRAFT',CURRENT_DATE,$6,$7,$8)`,[id, tenantId, input.supplierId, input.refInvoiceId, `DN-${Date.now()}`, input.amount, input.taxAmount??'0.0000', total]);
  return {id};
}
export async function postDebitNote(tenantId:string, debitId:string): Promise<{journalId:string}>{
  const pool=getPool(); const r=await pool.query(`SELECT supplier_id, amount, tax_amount, total, status FROM debit_notes WHERE id=$1 AND tenant_id=$2`,[debitId, tenantId]);
  if(!r.rows.length) throw Object.assign(new Error('not_found'),{status:404});
  const row=r.rows[0] as {supplier_id:string; amount:string; tax_amount:string; total:string; status:string};
  if(row.status==='POSTED') throw Object.assign(new Error('ALREADY_POSTED'),{status:409});
  const jl=[{purpose:'AP_CONTROL', direction:'debit' as const, amount: row.total, partnerId: row.supplier_id}, {purpose:'INVENTORY', direction:'credit' as const, amount: row.amount}];
  if(Number(row.tax_amount)!==0) jl.push({purpose:'VAT_RECOVERABLE', direction:'credit' as const, amount: row.tax_amount});
  const res=await postJournal(tenantId,'SAR',{ entryDate: new Date().toISOString().slice(0,10), currency:'SAR', description:`Debit note ${debitId}`, lines: jl, source:{docType:'debit_note', docId: debitId, operation:'POST'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string; partnerId?:string}[]; source:{docType:string; docId:string; operation:string}});
  await pool.query(`UPDATE debit_notes SET status='POSTED', posted_journal_id=$1 WHERE id=$2`,[res.id, debitId]);
  return {journalId: res.id};
}
