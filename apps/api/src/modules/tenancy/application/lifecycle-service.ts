import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export async function suspendTenant(tenantId: string, actorId: string, reason: string): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE tenants SET status='SUSPENDED', updated_at=now() WHERE id=$1`, [tenantId]);
  // kill sessions (tenant_suspended semantics: identity checks tenant status on next request)
  await pool.query(`UPDATE sessions SET revoked_at=now() WHERE active_tenant_id=$1 OR user_id IN (SELECT user_id FROM memberships WHERE tenant_id=$1)`, [tenantId]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'tenant.suspended','tenant',$2,$4)`, [crypto.randomUUID(), tenantId, actorId, JSON.stringify({ reason, via_platform_admin: true })]);
  // emit tenant.suspended
}

export async function restoreTenant(tenantId: string, actorId: string): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE tenants SET status='ACTIVE', updated_at=now() WHERE id=$1`, [tenantId]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'tenant.restored','tenant',$2,$4)`, [crypto.randomUUID(), tenantId, actorId, JSON.stringify({ via_platform_admin: true })]);
}

export function isSuspended(tenantStatus: string): boolean { return tenantStatus === 'SUSPENDED'; }
export function syncRejectIfSuspended(status: string): { rejected: boolean; code?: string } {
  if (status === 'SUSPENDED') return { rejected: true, code: 'tenant_suspended' };
  return { rejected: false };
}
