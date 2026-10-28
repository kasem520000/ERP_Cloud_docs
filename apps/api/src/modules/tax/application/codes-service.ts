import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function createTaxCode(tenantId:string, input:{ code:string; name:string; jurisdictionCode:string; treatment:string; rate:string }): Promise<{id:string}>{
  const pool=getPool(); const dup=await pool.query(`SELECT id FROM tax_codes WHERE tenant_id=$1 AND code=$2`,[tenantId,input.code]); if(dup.rows.length) throw Object.assign(new Error('code_duplicate'),{status:409});
  const id=crypto.randomUUID(); await pool.query(`INSERT INTO tax_codes (id, tenant_id, code, name, jurisdiction_code, treatment, rate) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[id,tenantId,input.code,input.name,input.jurisdictionCode,input.treatment,input.rate]); return {id};
}
export async function listTaxCodes(tenantId:string){ const pool=getPool(); const r=await pool.query(`SELECT * FROM tax_codes WHERE tenant_id=$1`,[tenantId]); return r.rows; }
