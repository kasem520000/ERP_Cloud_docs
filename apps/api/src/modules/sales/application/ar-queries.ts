import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
// AR aging deterministic as-of BR-028 RC-10; statement running balance; INV-009 AR_CONTROL tie
export async function getAging(tenantId:string, asOf:string): Promise<{ buckets:{ notDue:string; d1_30:string; d31_60:string; d61_90:string; over90:string }; total:string }>{
  const pool=getPool();
  const q=await pool.query(`SELECT due_date, total, COALESCE(alloc.amount,0) as allocated FROM sales_invoices LEFT JOIN (SELECT invoice_id, SUM(amount::numeric) as amount FROM ar_allocations GROUP BY invoice_id) alloc ON alloc.invoice_id=sales_invoices.id WHERE tenant_id=$1 AND invoice_date <= $2::date AND status='POSTED'`,[tenantId, asOf]);
  let notDue='0.0000', d1_30='0.0000', d31_60='0.0000', d61_90='0.0000', over90='0.0000';
  for(const r of q.rows as {due_date:string; total:string; allocated:string}[]){
    const open=(Number(r.total)-Number(r.allocated)).toFixed(4);
    const days=Math.floor((new Date(asOf).getTime()-new Date(r.due_date).getTime())/86400000);
    if(days<0) notDue=(Number(notDue)+Number(open)).toFixed(4);
    else if(days<=30) d1_30=(Number(d1_30)+Number(open)).toFixed(4);
    else if(days<=60) d31_60=(Number(d31_60)+Number(open)).toFixed(4);
    else if(days<=90) d61_90=(Number(d61_90)+Number(open)).toFixed(4);
    else over90=(Number(over90)+Number(open)).toFixed(4);
  }
  return { buckets:{ notDue, d1_30, d31_60, d61_90, over90 }, total: (Number(notDue)+Number(d1_30)+Number(d31_60)+Number(d61_90)+Number(over90)).toFixed(4) };
}
export async function getCustomerStatement(tenantId:string, customerId:string, from:string, to:string): Promise<{ entries:{date:string; docType:string; docNo:string; amount:string; balance:string}[]; total:string }>{
  // deterministic as-of recomputation RC-10; balance = subledger sum = AR_CONTROL contribution INV-009
  const pool=getPool();
  const q=await pool.query(`SELECT invoice_date as date, 'sales_invoice' as doc_type, invoice_no as doc_no, total as amount FROM sales_invoices WHERE tenant_id=$1 AND customer_id=$2 AND invoice_date BETWEEN $3::date AND $4::date AND status='POSTED' UNION ALL SELECT credit_date as date, 'credit_note' as doc_type, credit_no as doc_no, -total as amount FROM credit_notes WHERE tenant_id=$1 AND customer_id=$2 AND credit_date BETWEEN $3::date AND $4::date AND status='POSTED' UNION ALL SELECT value_date as date, 'receipt' as doc_type, receipt_no as doc_no, -amount as amount FROM receipts WHERE tenant_id=$1 AND partner_id=$2 AND value_date BETWEEN $3::date AND $4::date AND status='POSTED' ORDER BY date`,[tenantId, customerId, from, to]);
  let balance='0.0000'; const entries: {date:string; docType:string; docNo:string; amount:string; balance:string}[]=[];
  for(const r of q.rows as {date:string; doc_type:string; doc_no:string; amount:string}[]){ balance=(Number(balance)+Number(r.amount)).toFixed(4); entries.push({date:r.date, docType:r.doc_type, docNo:r.doc_no, amount:r.amount, balance}); }
  return { entries, total: balance };
}
export async function reconcileAr(tenantId:string): Promise<{status:'OK'|'BROKEN'; diff?:string}>{
  const pool=getPool();
  const subQ=await pool.query(`SELECT COALESCE(SUM(total::numeric - COALESCE(alloc.amount,0)),0) as total FROM sales_invoices LEFT JOIN (SELECT invoice_id, SUM(amount::numeric) as amount FROM ar_allocations GROUP BY invoice_id) alloc ON alloc.invoice_id=sales_invoices.id WHERE sales_invoices.tenant_id=$1 AND status='POSTED'`,[tenantId]);
  const glQ=await pool.query(`SELECT COALESCE(SUM(CASE WHEN direction='debit' THEN amount::numeric ELSE -amount::numeric END),0) as bal FROM journal_lines JOIN journal_entries ON journal_entries.id=journal_lines.journal_entry_id WHERE journal_lines.tenant_id=$1 AND account_id IN (SELECT account_id FROM account_purposes WHERE purpose_key='AR_CONTROL')`,[tenantId]);
  const sub=(subQ.rows[0] as {total:string}).total; const gl=(glQ.rows[0] as {bal:string}).bal;
  if(sub!==gl) return {status:'BROKEN', diff:`subledger ${sub} != GL ${gl}`};
  await pool.query(`INSERT INTO reconciliation_runs (id, tenant_id, check_key, status, details) VALUES ($1,$2,'ar_009','PASSED',$3)`,[crypto.randomUUID(), tenantId, JSON.stringify({ok:true})]);
  return {status:'OK'};
}
