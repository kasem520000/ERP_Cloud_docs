import { getPool } from '../../../infra/db/db.js';
export async function prepareVatReturn(tenantId:string, periodFrom:string, periodTo:string, _jurisdictionCode:string): Promise<{ summary:{byTreatment:string[]; totalTax:string}; glCheck:{documentTax:string; glMovements:string; match:boolean}; ready:boolean }>{
  const pool=getPool();
  // Aggregate document summaries (stored in receipts/payments/expenses tax summaries — stub: sum of tax from treasury lines)
  const docAgg=await pool.query(`SELECT COALESCE(SUM(amount::numeric),0)::text AS tot FROM receipts WHERE tenant_id=$1 AND value_date BETWEEN $2 AND $3`,[tenantId,periodFrom,periodTo]);
  const docTax=(docAgg.rows[0] as {tot:string}).tot;
  // GL movements: VAT_PAYABLE postings
  const glAgg=await pool.query(`SELECT COALESCE(SUM(jl.amount::numeric),0)::text AS tot FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id JOIN account_purposes ap ON ap.account_id=jl.account_id WHERE jl.tenant_id=$1 AND je.entry_date BETWEEN $2 AND $3 AND ap.purpose_key IN ('VAT_PAYABLE','VAT_RECOVERABLE')`,[tenantId,periodFrom,periodTo]);
  const glTax=(glAgg.rows[0] as {tot:string}|undefined)?.tot ?? '0';
  const match=docTax===glTax;
  return { summary:{byTreatment:[`STANDARD_RATED:${docTax}`], totalTax: docTax}, glCheck:{documentTax: docTax, glMovements: glTax, match}, ready: match };
}
export async function markFiled(tenantId:string, returnId:string, filedBy:string): Promise<void>{
  const pool=getPool(); const { randomUUID } = await import('node:crypto'); await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'tax.returns.mark_filed','vat_return',$4,$5)`,[randomUUID(),tenantId,filedBy,returnId, JSON.stringify({filedAt:new Date().toISOString()})]);
}
