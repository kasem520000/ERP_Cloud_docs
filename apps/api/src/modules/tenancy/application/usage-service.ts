import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export async function getUsage(tenantId: string, counterKey: string): Promise<{value:number; limit:number|null; percent:number|null}>{
  const pool=getPool();
  const r=await pool.query(`SELECT value, limit_value FROM usage_counters WHERE tenant_id=$1 AND counter_key=$2`,[tenantId, counterKey]);
  if(!r.rows.length) return {value:0, limit:null, percent:null};
  const {value, limit_value}=r.rows[0] as {value:number; limit_value:number|null};
  const percent=limit_value ? Math.round((value/limit_value)*100) : null;
  return {value, limit: limit_value, percent};
}

export async function incrementCounter(tenantId: string, counterKey: string, delta=1): Promise<void>{
  const pool=getPool();
  const period=new Date().toISOString().slice(0,7); // YYYY-MM
  await pool.query(`INSERT INTO usage_counters (id, tenant_id, counter_key, period, value) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (tenant_id, counter_key, period) DO UPDATE SET value=usage_counters.value + EXCLUDED.value, updated_at=now()`,[crypto.randomUUID(), tenantId, counterKey, period, delta]);
  const planLimitsQ=await pool.query(`SELECT p.limits FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.tenant_id=$1`,[tenantId]);
  const limits=(planLimitsQ.rows[0] as {limits: Record<string,number>}|undefined)?.limits;
  const limit=limits?.[counterKey];
  if(limit){
    const cur=await getUsage(tenantId, counterKey);
    if(cur.percent!==null && cur.percent>=80){
      await pool.query(`INSERT INTO notifications (id, tenant_id, kind, title, body, payload) VALUES ($1,$2,'limit_warning',$3,$4,$5)`,[crypto.randomUUID(), tenantId, `تحذير حد الاستخدام ${counterKey} ${cur.percent}%`, `Usage ${counterKey} at ${cur.percent}% of ${limit}`, JSON.stringify({counterKey, percent:cur.percent, limit})]);
    }
  }
}

// Hard blocks only on creation actions; documents/month never blocks posting (INV-022)
export async function enforceCreateLimit(tenantId: string, counterKey: 'users'|'branches'|'warehouses'|'terminals'|'devices'): Promise<void>{
  const u=await getUsage(tenantId, counterKey);
  if(u.limit!==null && u.value >= u.limit){
    throw Object.assign(new Error(`limit_exceeded: ${counterKey} ${u.value}/${u.limit}`),{status:429, code:'limit_exceeded', limit:counterKey, usage:u.value});
  }
}

// Documents/month documents_month: property — posting NEVER fails due to counter (INV-022)
export async function checkPostingAllowed(_tenantId: string): Promise<boolean>{ return true; }
