import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';
import { materializeEntitlements } from './entitlements-service.js';

export type SubStatus = 'TRIAL'|'ACTIVE'|'PAST_DUE'|'GRACE'|'SUSPENDED'|'CANCELLED';

const TRANSITIONS: Record<SubStatus, SubStatus[]> = {
  TRIAL: ['ACTIVE','GRACE','CANCELLED'],
  ACTIVE: ['PAST_DUE','GRACE','SUSPENDED','CANCELLED'],
  PAST_DUE: ['ACTIVE','GRACE','SUSPENDED'],
  GRACE: ['ACTIVE','SUSPENDED'],
  SUSPENDED: ['ACTIVE'],
  CANCELLED: [],
};

export function canTransition(from: SubStatus, to: SubStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export async function createTrial(tenantId: string, trialDays=14): Promise<{id:string}>{
  const pool=getPool();
  const id=crypto.randomUUID();
  const ends=new Date(Date.now()+trialDays*24*3600*1000);
  await pool.query(`INSERT INTO subscriptions (id, tenant_id, plan_id, status, period_start, period_end, trial_ends_at, current_period_start, current_period_end) VALUES ($1,$2,(SELECT id FROM plans WHERE key='business'), 'TRIAL', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days')`,[id, tenantId, ends.toISOString()]);
  await materializeEntitlements(tenantId, 'business');
  // TRIAL source with expires_at
  await pool.query(`UPDATE entitlements SET source='TRIAL', expires_at=$2 WHERE tenant_id=$1`,[tenantId, ends.toISOString()]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$2,'subscription.trial_started','subscription',$1,$3)`,[id, tenantId, JSON.stringify({plan:'business', trialDays})]);
  return {id};
}

export async function changePlan(tenantId: string, newPlanKey: string): Promise<void>{
  const pool=getPool();
  // downgrade blocker check: compare usage vs target limits
  const planQ=await pool.query(`SELECT limits FROM plans WHERE key=$1`,[newPlanKey]);
  const limits=(planQ.rows[0] as {limits: Record<string,number>})?.limits ?? {};
  const blockers: string[]=[];
  for(const k of ['users','branches','warehouses'] as const){
    const usageQ=await pool.query(`SELECT value FROM usage_counters WHERE tenant_id=$1 AND counter_key=$2`,[tenantId, k]);
    const cur=(usageQ.rows[0] as {value:number}|undefined)?.value ?? 0;
    const lim=limits[k];
    if(lim!==undefined && lim!==999 && cur > lim) blockers.push(`${k}: ${cur} > ${lim} — deactivate ${cur-lim}`);
  }
  if(blockers.length){
    await pool.query(`UPDATE subscriptions SET downgrade_blockers=$2 WHERE tenant_id=$1`,[tenantId, JSON.stringify(blockers)]);
    throw Object.assign(new Error(`downgrade_blocked: ${blockers.join('; ')}`),{status:422, code:'downgrade_blocked', blockers});
  }
  const planIdQ=await pool.query(`SELECT id FROM plans WHERE key=$1`,[newPlanKey]);
  const planId=(planIdQ.rows[0] as {id:string}).id;
  await pool.query(`UPDATE subscriptions SET plan_id=$2, updated_at=now(), downgrade_blockers=NULL WHERE tenant_id=$1`,[tenantId, planId]);
  await materializeEntitlements(tenantId, newPlanKey);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$2,'subscription.plan_changed','subscription',$2,$3)`,[crypto.randomUUID(), tenantId, tenantId, JSON.stringify({newPlanKey})]);
}

export async function enterGrace(tenantId: string, days=14): Promise<void>{
  const pool=getPool();
  const sub=await pool.query(`SELECT status FROM subscriptions WHERE tenant_id=$1`,[tenantId]);
  const cur=(sub.rows[0] as {status:SubStatus}|undefined)?.status ?? 'ACTIVE';
  if(!canTransition(cur,'GRACE')) throw Object.assign(new Error(`invalid_transition ${cur}→GRACE`),{status:422});
  const graceEnds=new Date(Date.now()+days*24*3600*1000);
  await pool.query(`UPDATE subscriptions SET status='GRACE', grace_ends_at=$2, updated_at=now() WHERE tenant_id=$1`,[tenantId, graceEnds.toISOString()]);
  await pool.query(`INSERT INTO notifications (id, tenant_id, kind, title, body) VALUES ($1,$2,'subscription_state','دخلت فترة السماح / Grace period','Subscription in read-only grace — pay to restore')`,[crypto.randomUUID(), tenantId]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$2,'subscription.grace_entered','subscription',$2,$3)`,[crypto.randomUUID(), tenantId, tenantId, JSON.stringify({graceEnds})]);
}

export async function suspendFromGrace(tenantId: string, reason='grace_expired'): Promise<void>{
  const pool=getPool();
  await pool.query(`UPDATE subscriptions SET status='SUSPENDED', suspended_at=now(), suspended_reason=$2, updated_at=now() WHERE tenant_id=$1`,[tenantId, reason]);
  await pool.query(`UPDATE tenants SET status='SUSPENDED', updated_at=now() WHERE id=$1`,[tenantId]);
  await pool.query(`UPDATE sessions SET revoked_at=now() WHERE active_tenant_id=$1 OR user_id IN (SELECT user_id FROM memberships WHERE tenant_id=$1)`,[tenantId]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$2,'tenant.suspended','tenant',$2,$3)`,[crypto.randomUUID(), tenantId, tenantId, JSON.stringify({reason, via:'grace'})]);
}

export async function restoreFromSuspend(tenantId: string): Promise<void>{
  const pool=getPool();
  await pool.query(`UPDATE subscriptions SET status='ACTIVE', grace_ends_at=NULL, suspended_at=NULL, suspended_reason=NULL, updated_at=now() WHERE tenant_id=$1`,[tenantId]);
  await pool.query(`UPDATE tenants SET status='ACTIVE', updated_at=now() WHERE id=$1`,[tenantId]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$2,'tenant.restored','tenant',$2,$3)`,[crypto.randomUUID(), tenantId, tenantId, JSON.stringify({via:'payment'})]);
}

// Read-only enforcement: state-changing routes must fail with subscription_read_only
export async function enforceNotReadOnly(tenantId: string): Promise<void>{
  const pool=getPool();
  const sub=await pool.query(`SELECT status FROM subscriptions WHERE tenant_id=$1`,[tenantId]);
  const st=(sub.rows[0] as {status:string}|undefined)?.status;
  if(st==='GRACE') throw Object.assign(new Error('subscription_read_only: pay to restore — grace read-only'),{status:403, code:'subscription_read_only', resolvingAction:'pay'});
  if(st==='SUSPENDED') throw Object.assign(new Error('tenant_suspended'),{status:403, code:'tenant_suspended'});
}

// Webhook handler (sandbox): signature-verified, replay-safe via idempotency key
export async function handleWebhook(eventId: string, tenantId: string, planKey: string, signatureOk: boolean): Promise<{activated:boolean}>{
  if(!signatureOk) throw Object.assign(new Error('invalid_signature'),{status:401});
  const pool=getPool();
  const existing=await pool.query(`SELECT 1 FROM audit_events WHERE entity_id=$1 AND action='webhook.processed'`,[eventId]);
  if(existing.rows.length) return {activated:false}; // idempotent replay
  await changePlan(tenantId, planKey);
  await pool.query(`UPDATE subscriptions SET status='ACTIVE', provider_ref=$2, updated_at=now() WHERE tenant_id=$1`,[tenantId, eventId]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$2,'webhook.processed','subscription',$3,$4)`,[crypto.randomUUID(), tenantId, tenantId, eventId, JSON.stringify({eventId, planKey})]);
  return {activated:true};
}
