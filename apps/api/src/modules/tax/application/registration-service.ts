import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function upsertRegistration(tenantId:string, input:{ jurisdictionCode:string; status:'REGISTERED'|'NOT_REGISTERED'|'DEREGISTERED'; registrationNo?:string }): Promise<{id:string}>{
  const pool=getPool(); const existing=await pool.query(`SELECT id FROM tax_registrations WHERE tenant_id=$1 AND jurisdiction_code=$2`,[tenantId,input.jurisdictionCode]);
  if(existing.rows.length){ await pool.query(`UPDATE tax_registrations SET status=$1, registration_no=$2 WHERE tenant_id=$3 AND jurisdiction_code=$4`,[input.status,input.registrationNo??null,tenantId,input.jurisdictionCode]); return {id:(existing.rows[0] as {id:string}).id}; }
  const id=crypto.randomUUID(); await pool.query(`INSERT INTO tax_registrations (id, tenant_id, jurisdiction_code, status, registration_no) VALUES ($1,$2,$3,$4,$5)`,[id,tenantId,input.jurisdictionCode,input.status,input.registrationNo??null]); return {id};
}
export async function migrateFromSettings(tenantId:string): Promise<void>{
  const pool=getPool(); const settings=await pool.query(`SELECT key, value FROM tenant_settings WHERE tenant_id=$1 AND key LIKE 'tax.registration.%'`,[tenantId]);
  for(const row of settings.rows as {key:string; value:unknown}[]){ const cc=row.key.split('.')[2]?.toUpperCase() ?? 'SA'; const val=(row.value as {status?:string})?.status ?? 'NOT_REGISTERED'; await upsertRegistration(tenantId,{jurisdictionCode:cc, status: val as 'REGISTERED'}); }
}
