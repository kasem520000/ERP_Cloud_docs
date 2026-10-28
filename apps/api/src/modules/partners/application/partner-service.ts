import crypto from 'node:crypto';
import { getPool } from '../../../infra/db/db.js';

export type PartnerKind = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
export type CreatePartnerInput = {
  kind: PartnerKind; code?: string; name: string; nameAr?: string;
  taxNumber?: string; creditLimit?: string; creditTermsId?: string; priceListId?: string; branchId?: string;
};
const CODE_RE = /^[A-Z0-9_-]{2,20}$/;

function autoCode(): string { return 'PRT-' + crypto.randomUUID().slice(0, 8).toUpperCase(); }

export async function createPartner(tenantId: string, input: CreatePartnerInput): Promise<{ id: string; code: string }> {
  if (!['CUSTOMER','SUPPLIER','BOTH'].includes(input.kind)) throw Object.assign(new Error('invalid_kind'), { status: 400 });
  if (!input.name || input.name.trim().length < 2) throw Object.assign(new Error('name_required'), { status: 400 });
  const code = (input.code ?? autoCode()).toUpperCase();
  if (!CODE_RE.test(code)) throw Object.assign(new Error('invalid_code'), { status: 400 });
  if (input.creditLimit !== undefined && !/^-?\d{1,15}(\.\d{1,4})?$/.test(input.creditLimit)) throw Object.assign(new Error('invalid_credit_limit'), { status: 400 });

  const pool = getPool();
  // cross-tenant reference guard (S-04): if creditTermsId/priceListId provided, verify tenant scoping
  if (input.creditTermsId) {
    const r = await pool.query(`SELECT id FROM credit_terms WHERE id=$1 AND tenant_id=$2`, [input.creditTermsId, tenantId]);
    if (r.rows.length === 0) throw Object.assign(new Error('credit_terms_not_found'), { status: 404 });
  }
  if (input.priceListId) {
    const r = await pool.query(`SELECT id FROM price_lists WHERE id=$1 AND tenant_id=$2`, [input.priceListId, tenantId]);
    if (r.rows.length === 0) throw Object.assign(new Error('price_list_not_found'), { status: 404 });
  }
  // S-04: if partner code already exists tenant-unique
  const dup = await pool.query(`SELECT id FROM partners WHERE tenant_id=$1 AND code=$2`, [tenantId, code]);
  if (dup.rows.length > 0) throw Object.assign(new Error('code_duplicate'), { status: 409 });
  const id = crypto.randomUUID();
  await pool.query(`INSERT INTO partners (id, tenant_id, kind, code, name, name_ar, tax_number, credit_limit, credit_terms_id, price_list_id, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ACTIVE')`,
    [id, tenantId, input.kind, code, input.name, input.nameAr ?? null, input.taxNumber ?? null, input.creditLimit ?? '0', input.creditTermsId ?? null, input.priceListId ?? null]);
  // audit
  await pool.query(`INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id, after) VALUES ($1,$2,'partner.created','partner',$3,$4)`,
    [crypto.randomUUID(), tenantId, id, JSON.stringify({ code, name: input.name })]);
  return { id, code };
}

export async function updatePartner(tenantId: string, partnerId: string, patch: Partial<CreatePartnerInput> & { version?: number; kind?: PartnerKind }): Promise<void> {
  const pool = getPool();
  const cur = await pool.query(`SELECT kind, version FROM partners WHERE id=$1 AND tenant_id=$2`, [partnerId, tenantId]);
  if (cur.rows.length === 0) throw Object.assign(new Error('not_found'), { status: 404 });
  if (patch.version !== undefined && cur.rows[0].version !== patch.version) throw Object.assign(new Error('stale_version'), { status: 409 });
  // BR-025: kind change blocked if postings exist — DRAFT-only in 006, POSTED check for future PHASE-007
  if (patch.kind && patch.kind !== cur.rows[0].kind) {
    const hasPostings = await pool.query(`SELECT id FROM opening_balance_docs WHERE partner_id=$1 AND tenant_id=$2 AND status='POSTED' LIMIT 1`, [partnerId, tenantId]);
    if (hasPostings.rows.length > 0) throw Object.assign(new Error('kind_change_blocked_has_postings'), { status: 409 });
  }
  const sets: string[] = []; const vals: unknown[] = []; let idx = 1;
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'version' || v === undefined) continue;
    const col = k === 'nameAr' ? 'name_ar' : k === 'creditTermsId' ? 'credit_terms_id' : k === 'priceListId' ? 'price_list_id' : k === 'taxNumber' ? 'tax_number' : k === 'creditLimit' ? 'credit_limit' : k;
    sets.push(`${col}=$${idx++}`); vals.push(v);
  }
  if (sets.length === 0) return;
  sets.push(`version=version+1`); sets.push(`updated_at=now()`);
  vals.push(partnerId, tenantId);
  await pool.query(`UPDATE partners SET ${sets.join(', ')} WHERE id=$${idx} AND tenant_id=$${idx+1}`, vals);
}

export async function listPartners(tenantId: string, opts: { kind?: string; q?: string; cursor?: string; limit?: number } = {}): Promise<{ rows: unknown[]; nextCursor: string | null }> {
  const pool = getPool();
  const lim = Math.min(opts.limit ?? 20, 100);
  let sql = `SELECT id, kind, code, name, name_ar, status FROM partners WHERE tenant_id=$1 AND deleted_at IS NULL`;
  const vals: unknown[] = [tenantId]; let idx = 2;
  if (opts.kind) { sql += ` AND kind=$${idx++}`; vals.push(opts.kind); }
  if (opts.q) { sql += ` AND (name ILIKE $${idx} OR name_ar ILIKE $${idx} OR code ILIKE $${idx})`; vals.push(`%${opts.q}%`); idx++; }
  if (opts.cursor) { sql += ` AND id > $${idx++}`; vals.push(opts.cursor); }
  sql += ` ORDER BY code ASC LIMIT $${idx}`; vals.push(lim + 1);
  const r = await pool.query(sql, vals);
  const rows = r.rows.slice(0, lim);
  const nextCursor = r.rows.length > lim ? (rows[rows.length-1] as { id: string }).id : null;
  return { rows, nextCursor };
}

export async function archivePartner(tenantId: string, partnerId: string): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE partners SET status='ARCHIVED', deleted_at=now(), updated_at=now() WHERE id=$1 AND tenant_id=$2`, [partnerId, tenantId]);
}
