import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function openAccount(tenantId:string, input:{ code:string; name:string; type:'CASH'|'BANK'|'PETTY'; accountId:string; currencyCode?:string; branchId?:string }): Promise<{id:string}>{
  const pool=getPool(); const dup=await pool.query(`SELECT id FROM cash_accounts WHERE tenant_id=$1 AND code=$2`,[tenantId,input.code]); if(dup.rows.length) throw Object.assign(new Error('code_duplicate'),{status:409});
  const id=crypto.randomUUID(); await pool.query(`INSERT INTO cash_accounts (id, tenant_id, code, name, type, account_id, currency_code, branch_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[id,tenantId,input.code,input.name,input.type,input.accountId,input.currencyCode??'SAR',input.branchId??null]); return {id};
}
export async function closeAccount(tenantId:string, id:string): Promise<void>{ const pool=getPool(); await pool.query(`UPDATE cash_accounts SET status='CLOSED' WHERE id=$1 AND tenant_id=$2`,[id,tenantId]); }
export async function getBalance(tenantId:string, accountId:string): Promise<string>{
  const pool=getPool(); const r=await pool.query(`SELECT COALESCE(SUM(CASE WHEN direction='IN' THEN amount::numeric ELSE -amount::numeric END),0)::text AS bal FROM cash_movements WHERE tenant_id=$1 AND cash_account_id=$2`,[tenantId,accountId]); return (r.rows[0] as {bal:string}).bal;
}
