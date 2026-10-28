/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export const FEATURE_CATALOG_DEPS: Record<string, string[]> = {
  'pos.terminals': ['platform.branches','inventory.stock_ledger'],
  'pos.sales': ['pos.terminals'],
  'manufacturing.boms': ['inventory.stock_ledger'],
  'distribution.settlements': ['sales.invoices'],
};

export function checkDependencyClosure(requested: string[], active: string[]): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const f of requested) {
    const deps = FEATURE_CATALOG_DEPS[f] ?? [];
    for (const d of deps) if (!requested.includes(d) && !active.includes(d)) missing.push(d);
  }
  return { ok: missing.length === 0, missing: [...new Set(missing)] };
}

export async function materializeEntitlements(tenantId: string, planKey: string): Promise<void> {
  const pool = getPool();
  const plan = await pool.query(`SELECT feature_keys FROM plans WHERE key=$1`, [planKey]);
  const features: string[] = plan.rows[0]?.feature_keys ?? [];
  for (const fk of features) {
    await pool.query(`INSERT INTO entitlements (id, tenant_id, feature_key, source) VALUES ($1,$2,$3,'PLAN') ON CONFLICT (tenant_id, feature_key) DO UPDATE SET source='PLAN'`, [crypto.randomUUID(), tenantId, fk]);
  }
}

export async function grantEntitlement(tenantId: string, featureKey: string, source: 'MANUAL'|'PROMO'|'TRIAL' = 'MANUAL', expiresAt?: Date): Promise<void> {
  const pool = getPool();
  // BR-040 check
  const current = await pool.query(`SELECT feature_key FROM entitlements WHERE tenant_id=$1 AND (expires_at IS NULL OR expires_at > now())`, [tenantId]);
  const active = (current.rows as { feature_key: string }[]).map(r => r.feature_key);
  const closure = checkDependencyClosure([featureKey], active);
  if (!closure.ok) throw Object.assign(new Error(`dependency_missing: ${closure.missing.join(',')}`), { status: 422, missing: closure.missing });
  await pool.query(`INSERT INTO entitlements (id, tenant_id, feature_key, source, expires_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (tenant_id, feature_key) DO UPDATE SET source=EXCLUDED.source, expires_at=EXCLUDED.expires_at`, [crypto.randomUUID(), tenantId, featureKey, source, expiresAt ?? null]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$2,'entitlement.granted','entitlement',$2,$3)`, [crypto.randomUUID(), tenantId, tenantId, JSON.stringify({ featureKey, source, via_platform_admin: true })]);
}

export async function hasFeature(tenantId: string, featureKey: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(`SELECT 1 FROM entitlements WHERE tenant_id=$1 AND feature_key=$2 AND (expires_at IS NULL OR expires_at > now())`, [tenantId, featureKey]);
  return res.rows.length > 0;
}

export async function enforceFeature(tenantId: string, featureKey: string): Promise<void> {
  const ok = await hasFeature(tenantId, featureKey);
  if (!ok) throw Object.assign(new Error('feature_not_entitled'), { status: 403, code: 'feature_not_entitled' });
}
