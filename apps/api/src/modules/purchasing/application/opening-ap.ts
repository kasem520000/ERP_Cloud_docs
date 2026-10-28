import { getPool } from '../../../infra/db/db.js';
// Opening AP balances settlement — G-16 AP side: open items from entry #1; INV-009 exact
export async function verifyOpeningAp(tenantId:string): Promise<{status:'OK'|'BROKEN'; diff?:string}>{
  const pool=getPool();
  const openQ=await pool.query(`SELECT COALESCE(SUM(amount::numeric),0) as sum FROM opening_balance_docs WHERE tenant_id=$1 AND kind='supplier' AND status='POSTED'`,[tenantId]);
  const glQ=await pool.query(`SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount::numeric ELSE -amount::numeric END),0) as bal FROM journal_lines WHERE tenant_id=$1 AND account_id IN (SELECT account_id FROM account_purposes WHERE purpose_key='AP_CONTROL')`,[tenantId]);
  const open=(openQ.rows[0] as {sum:string}).sum; const gl=(glQ.rows[0] as {bal:string}).bal;
  if(open!==gl) return {status:'BROKEN', diff:`${open} vs ${gl}`};
  return {status:'OK'};
}
