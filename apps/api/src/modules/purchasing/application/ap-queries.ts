import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';

/**
 * AP subledger = AP_CONTROL (INV-009)
 * Aging + statements deterministic as-of recomputations (BR-028)
 * GRNI register = GRNI account (RC-09)
 */
export async function getAging(tenantId:string, asOf:string): Promise<{ buckets:{ notDue:string; d1_30:string; d31_60:string; d61_90:string; over90:string }; total:string }>{
  const pool=getPool();
  const q=await pool.query(`SELECT due_date, total, COALESCE(allocated,0) as allocated FROM supplier_invoices LEFT JOIN (SELECT invoice_id, SUM(amount::numeric) as allocated FROM ap_allocations GROUP BY invoice_id) a ON a.invoice_id=supplier_invoices.id WHERE tenant_id=$1 AND invoice_date <= $2::date AND status='POSTED'`,[tenantId, asOf]);
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
  const total=(Number(notDue)+Number(d1_30)+Number(d31_60)+Number(d61_90)+Number(over90)).toFixed(4);
  return { buckets:{ notDue, d1_30, d31_60, d61_90, over90 }, total };
}

export async function getSupplierStatement(tenantId:string, supplierId:string, from:string, to:string): Promise<{ entries:{date:string; docType:string; docNo:string; amount:string; balance:string}[]; total:string }>{
  // running balance: statement entries with cumulative balance
  const pool=getPool();
  const q=await pool.query(`SELECT invoice_date as date, 'supplier_invoice' as doc_type, internal_no as doc_no, total as amount FROM supplier_invoices WHERE tenant_id=$1 AND supplier_id=$2 AND invoice_date BETWEEN $3::date AND $4::date AND status='POSTED' UNION ALL SELECT debit_date as date, 'debit_note' as doc_type, debit_no as doc_no, -total as amount FROM debit_notes WHERE tenant_id=$1 AND supplier_id=$2 AND debit_date BETWEEN $3::date AND $4::date AND status='POSTED' UNION ALL SELECT value_date as date, 'payment' as doc_type, payment_no as doc_no, -amount as amount FROM payments WHERE tenant_id=$1 AND partner_id=$2 AND value_date BETWEEN $3::date AND $4::date AND status='POSTED' ORDER BY date`,[tenantId, supplierId, from, to]);
  let balance='0.0000'; const entries: {date:string; docType:string; docNo:string; amount:string; balance:string}[]=[];
  for(const r of q.rows as {date:string; doc_type:string; doc_no:string; amount:string}[]){ balance=(Number(balance)+Number(r.amount)).toFixed(4); entries.push({date:r.date, docType:r.doc_type, docNo:r.doc_no, amount:r.amount, balance}); }
  return { entries, total: balance };
}

export async function getGrniRegister(tenantId:string): Promise<{ receiptId:string; grniAmount:string }[]>{
  const pool=getPool();
  const grns=await pool.query(`SELECT id, (SELECT SUM(line_amount::numeric) FROM goods_receipt_lines WHERE receipt_id=goods_receipts.id) as grni FROM goods_receipts WHERE tenant_id=$1 AND status='POSTED'`,[tenantId]);
  const invCleared=await pool.query(`SELECT grn_id, SUM(line_amount::numeric) as cleared FROM supplier_invoice_lines JOIN supplier_invoices ON supplier_invoices.id=supplier_invoice_lines.invoice_id WHERE supplier_invoices.tenant_id=$1 AND supplier_invoices.status='POSTED' GROUP BY grn_id`,[tenantId]);
  const clearedMap=new Map((invCleared.rows as {grn_id:string; cleared:string}[]).map(r=>[r.grn_id, Number(r.cleared)]));
  return (grns.rows as {id:string; grni:string}[]).map(r=> ({ receiptId: r.id, grniAmount: (Number(r.grni ?? 0) - (clearedMap.get(r.id)??0)).toFixed(4) }));
}

export async function reconcileAp(tenantId:string): Promise<{status:'OK'|'BROKEN'; diff?:string}>{
  const pool=getPool();
  const subledgerQ=await pool.query(`SELECT COALESCE(SUM(total::numeric - COALESCE(alloc.amount,0)),0) as total FROM supplier_invoices LEFT JOIN (SELECT invoice_id, SUM(amount::numeric) as amount FROM ap_allocations GROUP BY invoice_id) alloc ON alloc.invoice_id=supplier_invoices.id WHERE supplier_invoices.tenant_id=$1 AND status='POSTED'`,[tenantId]);
  const glQ=await pool.query(`SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount::numeric ELSE -amount::numeric END),0) as bal FROM journal_lines JOIN journal_entries ON journal_entries.id=journal_lines.journal_entry_id WHERE journal_lines.tenant_id=$1 AND account_id IN (SELECT account_id FROM account_purposes WHERE purpose_key='AP_CONTROL' AND tenant_id=$1)`,[tenantId]);
  const subledger=(subledgerQ.rows[0] as {total:string}).total;
  const gl=(glQ.rows[0] as {bal:string}).bal;
  if(subledger!==gl) return {status:'BROKEN', diff: `subledger ${subledger} != GL ${gl}`};
  await pool.query(`INSERT INTO reconciliation_runs (id, tenant_id, check_key, status, details) VALUES ($1,$2,'ap_009','PASSED',$3)`,[crypto.randomUUID(), tenantId, JSON.stringify({ok:true})]);
  return {status:'OK'};
}
