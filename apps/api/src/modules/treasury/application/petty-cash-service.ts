import { getPool } from '../../../infra/db/db.js';
// BR-020 petty cash caps: single_tx_limit / max_balance defaults PLACEHOLDER OQ-002
export async function checkPettyLimit(tenantId:string, cashAccountId:string, amount:string): Promise<void>{
  const pool=getPool(); const settings=await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key='treasury.petty_cash.single_tx_limit'`,[tenantId]);
  const limit=settings.rows.length ? Number((settings.rows[0] as {value:string}).value) : 1000; // PLACEHOLDER 1000 SAR
  if(Number(amount) > limit) throw Object.assign(new Error(`BR-020: exceeds single_tx_limit ${limit}`),{status:400});
  const balR=await pool.query(`SELECT COALESCE(SUM(CASE WHEN direction='IN' THEN amount::numeric ELSE -amount::numeric END),0)::text AS bal FROM cash_movements WHERE tenant_id=$1 AND cash_account_id=$2`,[tenantId,cashAccountId]);
  const maxBalQ=await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key='treasury.petty_cash.max_balance'`,[tenantId]);
  const maxBal=maxBalQ.rows.length ? Number((maxBalQ.rows[0] as {value:string}).value) : 5000;
  if(Number((balR.rows[0] as {bal:string}).bal) + Number(amount) > maxBal) throw Object.assign(new Error(`BR-020: exceeds max_balance ${maxBal}`),{status:400});
}
