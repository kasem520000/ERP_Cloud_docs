/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { getPool } from '../../../infra/db/db.js';
import { COA_TEMPLATE } from '../../../infra/db/seeds/chart-template.js';
import crypto from 'node:crypto';

export async function provisionWorkspace(tenantId: string): Promise<{ accounts: number; purposes: number; idempotent: boolean }> {
  const pool = getPool();
  // Idempotency check: if accounts already exist for tenant, skip
  const existing = await pool.query(`SELECT count(*) as c FROM accounts WHERE tenant_id=$1`, [tenantId]);
  const count = parseInt((existing.rows[0] as { c: string })?.c ?? '0', 10);
  if (count > 0) return { accounts: count, purposes: 0, idempotent: true };
  let purposes = 0;
  for (const a of COA_TEMPLATE) {
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO accounts (id, tenant_id, code, name, name_ar, type, is_system, status) VALUES ($1,$2,$3,$4,$5,$6,true,'ACTIVE') ON CONFLICT (tenant_id, code) DO NOTHING`, [id, tenantId, a.code, a.name, a.nameAr, a.type]);
    if (a.purpose) {
      const accRes = await pool.query(`SELECT id FROM accounts WHERE tenant_id=$1 AND code=$2`, [tenantId, a.code]);
      const accId = accRes.rows[0]?.id ?? id;
      await pool.query(`INSERT INTO account_purposes (id, tenant_id, purpose_key, account_id) VALUES ($1,$2,$3,$4) ON CONFLICT (tenant_id, purpose_key) DO NOTHING`, [crypto.randomUUID(), tenantId, a.purpose, accId]);
      purposes++;
    }
  }
  // instantiate system roles as tenant roles (if not exists)
  const templates = await pool.query(`SELECT key, name, name_ar FROM roles WHERE tenant_id IS NULL`);
  for (const r of templates.rows as { key: string; name: string; name_ar: string }[]) {
    const nr = crypto.randomUUID();
    await pool.query(`INSERT INTO roles (id, tenant_id, key, name, name_ar, is_system) VALUES ($1,$2,$3,$4,$5,false) ON CONFLICT (tenant_id, key) DO NOTHING`, [nr, tenantId, r.key, r.name, r.name_ar]);
  }
  // numbering defaults + jurisdiction binding + fiscal preference as settings
  await pool.query(`INSERT INTO tenant_settings (id, tenant_id, key, value) VALUES ($1,$2,'numbering.defaults',$3) ON CONFLICT (tenant_id, key) DO NOTHING`, [crypto.randomUUID(), tenantId, JSON.stringify({ sales_invoices: 'INV-{YYYY}-{SEQ:5}' })]);
  await pool.query(`INSERT INTO tenant_settings (id, tenant_id, key, value) VALUES ($1,$2,'jurisdiction.binding',$3) ON CONFLICT (tenant_id, key) DO NOTHING`, [crypto.randomUUID(), tenantId, JSON.stringify({ pack: 'default' })]);
  await pool.query(`INSERT INTO tenant_settings (id, tenant_id, key, value) VALUES ($1,$2,'fiscal.start_month',$3) ON CONFLICT (tenant_id, key) DO NOTHING`, [crypto.randomUUID(), tenantId, JSON.stringify(1)]);
  await pool.query(`INSERT INTO tenant_settings (id, tenant_id, key, value) VALUES ($1,$2,'general.default_locale',$3) ON CONFLICT (tenant_id, key) DO NOTHING`, [crypto.randomUUID(), tenantId, JSON.stringify('ar')]);
  await pool.query(`INSERT INTO tenant_settings (id, tenant_id, key, value) VALUES ($1,$2,'general.numeral_system',$3) ON CONFLICT (tenant_id, key) DO NOTHING`, [crypto.randomUUID(), tenantId, JSON.stringify('arabic')]);
  return { accounts: COA_TEMPLATE.length, purposes, idempotent: false };
}
