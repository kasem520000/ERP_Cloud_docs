import crypto from 'node:crypto';
import { getPool } from '../../../infra/db/db.js';

export type ItemKind = 'STOCK' | 'SERVICE' | 'COMPOSITE';
export type CreateItemInput = {
  sku?: string; name: string; nameAr?: string; kind: ItemKind;
  uomId: string; categoryId?: string; taxCodeId?: string | null;
  costingMethod?: 'WAC'|'FIFO'; trackBatch?: boolean; trackSerial?: boolean; trackImei?: boolean; hasExpiry?: boolean;
  reorderLevel?: string; reorderQty?: string;
  barcodes?: { code: string; uomId?: string }[];
};
const SKU_RE = /^[A-Z0-9_-]{2,30}$/;

function autoSku(): string { return 'SKU-' + crypto.randomUUID().slice(0, 8).toUpperCase(); }

export async function createItem(tenantId: string, input: CreateItemInput): Promise<{ id: string; sku: string }> {
  if (!['STOCK','SERVICE','COMPOSITE'].includes(input.kind)) throw Object.assign(new Error('invalid_kind'), { status: 400 });
  if (!input.name || input.name.trim().length < 2) throw Object.assign(new Error('name_required'), { status: 400 });
  const sku = (input.sku ?? autoSku()).toUpperCase();
  if (!SKU_RE.test(sku)) throw Object.assign(new Error('invalid_sku'), { status: 400 });
  // S-04: validate UoM tenant scoping (global NULL + own)
  const pool = getPool();
  const uomCheck = await pool.query(`SELECT id FROM uoms WHERE id=$1 AND (tenant_id IS NULL OR tenant_id=$2)`, [input.uomId, tenantId]);
  if (uomCheck.rows.length === 0) throw Object.assign(new Error('uom_not_found'), { status: 404 });
  if (input.categoryId) {
    const c = await pool.query(`SELECT id FROM item_categories WHERE id=$1 AND tenant_id=$2`, [input.categoryId, tenantId]);
    if (c.rows.length === 0) throw Object.assign(new Error('category_not_found'), { status: 404 });
  }
  // tax_code_id intentionally has no FK — verify existence not required per PHASE-009 contract; store nullable
  const dup = await pool.query(`SELECT id FROM items WHERE tenant_id=$1 AND sku=$2`, [tenantId, sku]);
  if (dup.rows.length > 0) throw Object.assign(new Error('sku_duplicate'), { status: 409 });
  // tracking flags validation: has_expiry only if track_batch
  if (input.hasExpiry && !input.trackBatch) throw Object.assign(new Error('expiry_requires_batch'), { status: 400 });

  const id = crypto.randomUUID();
  await pool.query(`INSERT INTO items (id, tenant_id, sku, name, name_ar, kind, uom_id, category_id, tax_code_id, costing_method, track_batch, track_serial, track_imei, has_expiry, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'ACTIVE')`,
    [id, tenantId, sku, input.name, input.nameAr ?? null, input.kind, input.uomId, input.categoryId ?? null, input.taxCodeId ?? null, input.costingMethod ?? 'WAC', !!input.trackBatch, !!input.trackSerial, !!input.trackImei, !!input.hasExpiry]);

  // barcodes uniqueness per tenant + per item+UoM
  if (input.barcodes) {
    for (const bc of input.barcodes) {
      const bdup = await pool.query(`SELECT id FROM barcodes WHERE tenant_id=$1 AND code=$2`, [tenantId, bc.code]);
      if (bdup.rows.length > 0) throw Object.assign(new Error(`barcode_duplicate:${bc.code}`), { status: 409 });
      await pool.query(`INSERT INTO barcodes (id, tenant_id, item_id, code, uom_id) VALUES ($1,$2,$3,$4,$5)`, [crypto.randomUUID(), tenantId, id, bc.code, bc.uomId ?? input.uomId]);
    }
  }
  await pool.query(`INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id, after) VALUES ($1,$2,'item.created','item',$3,$4)`,
    [crypto.randomUUID(), tenantId, id, JSON.stringify({ sku, name: input.name })]);
  return { id, sku };
}

export async function listItems(tenantId: string, opts: { kind?: string; q?: string; cursor?: string; limit?: number } = {}): Promise<{ rows: unknown[]; nextCursor: string | null }> {
  const pool = getPool();
  const lim = Math.min(opts.limit ?? 20, 100);
  let sql = `SELECT id, sku, name, name_ar, kind, status FROM items WHERE tenant_id=$1 AND deleted_at IS NULL`;
  const vals: unknown[] = [tenantId]; let idx = 2;
  if (opts.kind) { sql += ` AND kind=$${idx++}`; vals.push(opts.kind); }
  if (opts.q) { sql += ` AND (name ILIKE $${idx} OR name_ar ILIKE $${idx} OR sku ILIKE $${idx})`; vals.push(`%${opts.q}%`); idx++; }
  if (opts.cursor) { sql += ` AND id > $${idx++}`; vals.push(opts.cursor); }
  sql += ` ORDER BY sku ASC LIMIT $${idx}`; vals.push(lim + 1);
  const r = await pool.query(sql, vals);
  const rows = r.rows.slice(0, lim);
  const nextCursor = r.rows.length > lim ? (rows[rows.length-1] as { id: string }).id : null;
  return { rows, nextCursor };
}
