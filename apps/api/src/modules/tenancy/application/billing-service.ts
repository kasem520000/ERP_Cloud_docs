import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export interface CheckoutSession { id:string; url:string; planKey:string; tenantId:string; }

// Sandbox provider adapter (A-009/OQ-003): no prod go-live at MVP
export async function createCheckoutSession(tenantId: string, planKey: string): Promise<CheckoutSession>{
  const pool=getPool();
  const plan=await pool.query(`SELECT key FROM plans WHERE key=$1 AND is_active=true`,[planKey]);
  if(!plan.rows.length) throw Object.assign(new Error('plan_not_found'),{status:404});
  const id='cs_'+crypto.randomUUID().replace(/-/g,'');
  const url=`https://checkout.sandbox.erp.local/c/${id}`;
  await pool.query(`UPDATE subscriptions SET provider='sandbox', provider_checkout_id=$2, updated_at=now() WHERE tenant_id=$1`,[tenantId, id]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$2,'billing.checkout_created','subscription',$2,$3)`,[crypto.randomUUID(), tenantId, tenantId, JSON.stringify({checkoutId:id, planKey})]);
  return {id, url, planKey, tenantId};
}

// Manual invoicing fallback: platform staff records offline payment, same entitlement outcome
export async function recordManualPayment(tenantId: string, actorId: string, amount: string, method: string, reason: string): Promise<{subscriptionId:string}>{
  const pool=getPool();
  const sub=await pool.query(`SELECT id, plan_id FROM subscriptions WHERE tenant_id=$1`,[tenantId]);
  const sid=(sub.rows[0] as {id:string}).id;
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'billing.manual_payment','subscription',$4,$5)`,[crypto.randomUUID(), tenantId, actorId, sid, JSON.stringify({amount, method, reason, via_platform_admin:true})]);
  // activate if in grace/suspended
  await pool.query(`UPDATE subscriptions SET status='ACTIVE', grace_ends_at=NULL, suspended_at=NULL, updated_at=now() WHERE tenant_id=$1 AND status IN ('GRACE','SUSPENDED','PAST_DUE')`,[tenantId]);
  await pool.query(`UPDATE tenants SET status='ACTIVE', updated_at=now() WHERE id=$1 AND status='SUSPENDED'`,[tenantId]);
  await pool.query(`INSERT INTO notifications (id, tenant_id, kind, title, body) VALUES ($1,$2,'billing','تم تأكيد الدفع اليدوي','Manual payment recorded — subscription active')`,[crypto.randomUUID(), tenantId]);
  return {subscriptionId: sid};
}
