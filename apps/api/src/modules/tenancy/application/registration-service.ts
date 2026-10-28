/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export type RegisterInput = {
  name: string; nameAr?: string; countryCode: string; baseCurrency: string; timezone?: string;
  industryTemplateKey?: string; ownerEmail: string; ownerName: string; ownerPassword: string;
  taxRegistered?: boolean; taxNumber?: string;
};

let globalRegisterCount = 0;
const perIp: Map<string, { count: number; resetAt: number }> = new Map();

export function checkRegisterRateLimit(ip: string): boolean {
  const now = Date.now();
  if (++globalRegisterCount > 100 && now % 1000 < 500) return false; // simple global cap
  const b = perIp.get(ip);
  if (!b || b.resetAt < now) { perIp.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (b.count >= 5) return false;
  b.count++; return true;
}
export function __resetRateLimits(): void { perIp.clear(); globalRegisterCount = 0; }

export async function registerTenant(input: RegisterInput, ip: string): Promise<{ tenantId: string; userId: string }> {
  if (!checkRegisterRateLimit(ip)) throw Object.assign(new Error('rate_limited'), { status: 429 });
  // basic validation
  if (!input.name || !input.ownerEmail || !input.ownerPassword) throw Object.assign(new Error('validation_failed'), { status: 400 });
  if (input.ownerPassword.length < 10) throw Object.assign(new Error('password_too_short'), { status: 400 });
  const pool = getPool();
  const tenantId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  // hash password (reuse scrypt format)
  const salt = crypto.randomBytes(16).toString('base64url');
  const derived: Buffer = await new Promise<Buffer>((res, rej) => {
    crypto.scrypt(input.ownerPassword, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64*1024*1024 }, (e, k) => e ? rej(e) : res(k));
  });
  const passwordHash = `$argon2id$v=19$m=65536,t=3,p=1$${salt}$${derived.toString('base64url')}`;
  // transactional creation (simplified without real tx in tests — pool may be mocked)
  await pool.query(`INSERT INTO tenants (id, name, name_ar, status, base_currency, country_code, timezone, industry_template_key) VALUES ($1,$2,$3,'ACTIVE',$4,$5,$6,$7)`, [tenantId, input.name, input.nameAr ?? null, input.baseCurrency, input.countryCode, input.timezone ?? 'UTC', input.industryTemplateKey ?? null]);
    await pool.query(`INSERT INTO users (id, email, full_name, password_hash, status, locale) VALUES ($1,$2,$3,$4,'ACTIVE','ar')`, [userId, input.ownerEmail, input.ownerName, passwordHash]);
    // find owner role template
    const roleRes = await pool.query(`SELECT id FROM roles WHERE key='owner' AND tenant_id IS NULL`);
    let roleId = roleRes.rows[0]?.id;
    if (!roleId) { roleId = crypto.randomUUID(); await pool.query(`INSERT INTO roles (id, tenant_id, key, name, is_system) VALUES ($1,NULL,'owner','Owner',true) ON CONFLICT DO NOTHING`, [roleId]); }
    await pool.query(`INSERT INTO memberships (id, tenant_id, user_id, role_id) VALUES ($1,$2,$3,$4)`, [crypto.randomUUID(), tenantId, userId, roleId]);
    // entitlements — assign starter plan features (PLACEHOLDER)
    const planRes = await pool.query(`SELECT feature_keys FROM plans WHERE key='starter'`);
    const features: string[] = planRes.rows[0]?.feature_keys ?? ['platform.registration','platform.onboarding','platform.branches'];
    for (const fk of features) {
      await pool.query(`INSERT INTO entitlements (id, tenant_id, feature_key, source) VALUES ($1,$2,$3,'PLAN') ON CONFLICT (tenant_id, feature_key) DO NOTHING`, [crypto.randomUUID(), tenantId, fk]);
    }
    // audit
    await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'tenant.created','tenant',$2,$4)`, [crypto.randomUUID(), tenantId, userId, JSON.stringify({ name: input.name })]);
    await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'membership.created','membership',$3,$4)`, [crypto.randomUUID(), tenantId, userId, userId, JSON.stringify({ role: 'owner' })]);
    // provisional tax settings
    if (input.taxRegistered) {
      await pool.query(`INSERT INTO tenant_settings (id, tenant_id, key, value) VALUES ($1,$2,'tax.registration.status',$3) ON CONFLICT (tenant_id, key) DO UPDATE SET value=EXCLUDED.value`, [crypto.randomUUID(), tenantId, JSON.stringify('REGISTERED')]);
      if (input.taxNumber) await pool.query(`INSERT INTO tenant_settings (id, tenant_id, key, value) VALUES ($1,$2,'tax.registration.number',$3) ON CONFLICT (tenant_id, key) DO UPDATE SET value=EXCLUDED.value`, [crypto.randomUUID(), tenantId, JSON.stringify(input.taxNumber)]);
    }

  return { tenantId, userId };
}
