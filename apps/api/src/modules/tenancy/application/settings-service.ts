/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

const SCHEMA: Record<string, { type: string; enum?: string[] }> = {
  'tax.registration.status': { type: 'string', enum: ['REGISTERED','NOT_REGISTERED'] },
  'tax.registration.number': { type: 'string' },
  'general.default_locale': { type: 'string', enum: ['ar','en'] },
  'general.numeral_system': { type: 'string', enum: ['arabic','hindi'] },
  'fiscal.start_month': { type: 'number' },
  'numbering.defaults': { type: 'object' },
  'jurisdiction.binding': { type: 'object' },
};

export async function setSetting(tenantId: string, key: string, value: unknown, actorId?: string): Promise<void> {
  const rule = SCHEMA[key];
  if (!rule) throw Object.assign(new Error(`unknown_setting: ${key}`), { status: 400 });
  // simple type check
  const actual = typeof value === 'object' && value !== null && !Array.isArray(value) ? 'object' : typeof value;
  if (actual !== rule.type && !(rule.type === 'object' && actual === 'object')) throw Object.assign(new Error('invalid_type'), { status: 400 });
  if (rule.enum && !rule.enum.includes(value as string)) throw Object.assign(new Error('invalid_enum'), { status: 400 });
  const pool = getPool();
  const beforeRes = await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key=$2`, [tenantId, key]);
  const before = beforeRes.rows[0]?.value ?? null;
  await pool.query(`INSERT INTO tenant_settings (id, tenant_id, key, value, updated_by) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (tenant_id, key) DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=now()`, [crypto.randomUUID(), tenantId, key, JSON.stringify(value), actorId ?? null]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, before, after) VALUES ($1,$2,$3,'settings.changed','tenant_settings',$2,$4,$5)`, [crypto.randomUUID(), tenantId, actorId ?? tenantId, key, before ? JSON.stringify(before) : null, JSON.stringify(value)]);
  // invalidation event (in-process)
  // emit tenant.updated / settings.changed via pg-boss or event emitter — stubbed
}

export async function getSetting(tenantId: string, key: string): Promise<unknown> {
  const pool = getPool();
  const res = await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key=$2`, [tenantId, key]);
  return res.rows[0]?.value ?? null;
}
