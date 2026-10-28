import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function importStatement(tenantId:string, cashAccountId:string, fileHash:string, fileName:string, lines:{valueDate:string; amount:string; reference?:string; description?:string}[]): Promise<{statementId:string}>{
  const pool=getPool(); const existing=await pool.query(`SELECT id FROM bank_statements WHERE tenant_id=$1 AND file_hash=$2`,[tenantId,fileHash]); if(existing.rows.length) return {statementId:(existing.rows[0] as {id:string}).id};
  const id=crypto.randomUUID(); const periodStart=lines[0]?.valueDate ?? new Date().toISOString().slice(0,10); const periodEnd=lines[lines.length-1]?.valueDate ?? periodStart;
  await pool.query(`INSERT INTO bank_statements (id, tenant_id, cash_account_id, period_start, period_end, file_hash, file_name) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[id,tenantId,cashAccountId,periodStart,periodEnd,fileHash,fileName]);
  for(const l of lines){ await pool.query(`INSERT INTO bank_statement_lines (id, tenant_id, statement_id, value_date, amount, reference, description) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[crypto.randomUUID(),tenantId,id,l.valueDate,l.amount,l.reference??null,l.description??null]); }
  return {statementId:id};
}
export async function autoMatch(tenantId:string, statementId:string): Promise<{matched:number}>{
  const pool=getPool(); const stmts=await pool.query(`SELECT value_date, amount, reference, id FROM bank_statement_lines WHERE statement_id=$1 AND matched_movement_id IS NULL`,[statementId]);
  let matched=0; for(const row of stmts.rows as {value_date:string; amount:string; reference:string|null; id:string}[]){
    const mv=await pool.query(`SELECT id FROM cash_movements WHERE tenant_id=$1 AND amount=$2 AND value_date BETWEEN $3::date - interval '3 days' AND $3::date + interval '3 days' LIMIT 1`,[tenantId,row.amount,row.value_date]);
    if(mv.rows.length){ await pool.query(`UPDATE bank_statement_lines SET matched_movement_id=$1, matched_at=now() WHERE id=$2`,[(mv.rows[0] as {id:string}).id,row.id]); matched++; }
  } return {matched};
}
export async function reconcile(tenantId:string, statementId:string): Promise<void>{
  const pool=getPool(); const unr=await pool.query(`SELECT id FROM bank_statement_lines WHERE statement_id=$1 AND matched_movement_id IS NULL`,[statementId]); if(unr.rows.length) throw Object.assign(new Error('BR-022: unmatched items remain'),{status:409});
  await pool.query(`UPDATE bank_statements SET status='RECONCILED' WHERE id=$1`,[statementId]);
}
export async function unmatchedAging(tenantId:string, statementId:string): Promise<{statement:number; movements:number}>{
  const pool=getPool(); const s=await pool.query(`SELECT COUNT(*)::int AS c FROM bank_statement_lines WHERE statement_id=$1 AND matched_movement_id IS NULL`,[statementId]);
  const m=await pool.query(`SELECT COUNT(*)::int AS c FROM cash_movements WHERE tenant_id=$1 AND cash_account_id=(SELECT cash_account_id FROM bank_statements WHERE id=$2) AND id NOT IN (SELECT matched_movement_id FROM bank_statement_lines WHERE statement_id=$2 AND matched_movement_id IS NOT NULL)`,[tenantId,statementId]);
  return {statement:(s.rows[0] as {c:number}).c, movements:(m.rows[0] as {c:number}).c};
}
