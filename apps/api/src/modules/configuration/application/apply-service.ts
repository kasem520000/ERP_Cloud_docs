import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
// Activity → template resolution, entitlement+phase check, idempotent apply per PHASE-015 §4
const ACTIVITY_MAP: Record<string,string> = { retail:'industry.retail', supermarket:'industry.grocery', grocery:'industry.grocery', restaurant:'industry.restaurant', cafe:'industry.restaurant' };
export function resolveTemplate(activity:string): string {
  const k=ACTIVITY_MAP[activity.toLowerCase()] ?? 'industry.retail';
  return k;
}
export async function applyTemplate(tenantId:string, templateKey:string, actorId:string): Promise<{templateKey:string; version:string; diff:unknown}>{
  const pool=getPool();
  const tmpl=await pool.query(`SELECT version, manifest, manifest_hash FROM industry_templates WHERE key=$1 AND status='ACTIVE'`,[templateKey]);
  if(!tmpl.rows.length) throw Object.assign(new Error('template_not_found'),{status:404});
  const {version, manifest, manifest_hash}=tmpl.rows[0] as {version:string; manifest:unknown; manifest_hash:string};
  // entitlement check: required keys must be in entitlements
  const manifestObj=manifest as {required_feature_keys:string[]; phase_gated?:string[]};
  for(const rk of manifestObj.required_feature_keys??[]){
    const ent=await pool.query(`SELECT 1 FROM entitlements WHERE tenant_id=$1 AND feature_key=$2 AND (expires_at IS NULL OR expires_at>now())`,[tenantId, rk]);
    // allow phase-gated keys to pass with degraded mode
    if(!ent.rows.length && !manifestObj.phase_gated?.includes(rk)){
      throw Object.assign(new Error(`REQUIRED missing ${rk} — upgrade plan`),{status:403});
    }
  }
  // idempotent re-apply
  const existing=await pool.query(`SELECT applied_version FROM tenant_industry_config WHERE tenant_id=$1 AND template_key=$2`,[tenantId, templateKey]);
  if(existing.rows.length && (existing.rows[0] as {applied_version:string}).applied_version===version){
    return {templateKey, version, diff:{no_change:true}};
  }
  const diff={added: manifestObj, previous: existing.rows[0]??null, templateKey};
  await pool.query(`INSERT INTO tenant_industry_config (id, tenant_id, template_key, applied_version, applied_manifest_hash, overrides) VALUES ($1,$2,$3,$4,$5,'{}') ON CONFLICT (tenant_id, template_key) DO UPDATE SET applied_version=$4, applied_manifest_hash=$5, applied_at=now()`,[crypto.randomUUID(), tenantId, templateKey, version, manifest_hash]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'template.applied','tenant_industry_config',$2,$4)`,[crypto.randomUUID(), tenantId, actorId, JSON.stringify(diff)]);
  return {templateKey, version, diff};
}
// Additive-only switch BR-038: never delete data, never remove explicit setting, never renumber
export async function switchTemplate(tenantId:string, fromKey:string, toKey:string, actorId:string): Promise<{diff:unknown}>{
  const pool=getPool();
  const from=await pool.query(`SELECT applied_version FROM tenant_industry_config WHERE tenant_id=$1 AND template_key=$2`,[tenantId, fromKey]);
  if(!from.rows.length) throw Object.assign(new Error('not_applied'),{status:404});
  // apply toKey additively
  const res=await applyTemplate(tenantId, toKey, actorId);
  // archive previous: keep history, never delete tenant data
  const archived=(from.rows[0] as {applied_version:string}).applied_version;
  await pool.query(`UPDATE tenant_industry_config SET archived_history = archived_history || $3::jsonb WHERE tenant_id=$1 AND template_key=$2`,[tenantId, fromKey, JSON.stringify([{archived, at:new Date().toISOString()}])]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'template.switched','tenant_industry_config',$2,$4)`,[crypto.randomUUID(), tenantId, actorId, JSON.stringify({from:fromKey, to:toKey, diff:res.diff})]);
  return {diff: res.diff};
}
export async function previewSwitch(tenantId:string, fromKey:string, toKey:string){
  const pool=getPool();
  const toM=await pool.query(`SELECT manifest FROM industry_templates WHERE key=$1`,[toKey]);
  const fromM=await pool.query(`SELECT manifest FROM industry_templates WHERE key=$1`,[fromKey]);
  return {added: (toM.rows[0] as any)?.manifest, removed: [], renamed: [], archived: (fromM.rows[0] as any)?.manifest, note:'additive-only per BR-038 — no data loss'};
}
