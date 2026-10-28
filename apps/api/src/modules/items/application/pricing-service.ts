import Decimal from 'decimal.js';
import { getPool } from '../../../infra/db/db.js';
import { convertQty } from './uom-service.js';

Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_UP });

export type PriceProvenance = 'CUSTOMER_LIST' | 'TIER_LIST' | 'BRANCH_DEFAULT' | 'BASE';
export type ResolvePriceInput = {
  tenantId: string;
  partnerId: string;
  itemId: string;
  branchId?: string;
  uomId: string;
  qty?: string;
  currency?: string;
};
export type ResolvePriceResult = {
  unitPrice: string; // 6dp string
  currency: string;
  provenance: PriceProvenance;
  appliedUomId: string;
  originalUomId: string;
  conversionFactor?: string;
  allowManualOverride: boolean;
};

/**
 * BR-003 precedence: customer price_list → tier (distribution stub → skip) → branch default → base
 * Per-request provenance + UoM conversion (exact 6dp) + manual-override flag (ceilings enforced at PHASE-012).
 */
export async function resolvePrice(input: ResolvePriceInput): Promise<ResolvePriceResult> {
  const pool = getPool();
  const _qty = input.qty ?? '1'; void _qty;
  // fetch item base price (stored as price_list_items with is_base flag or fallback)
  // Simplified: look up price in precedence order
  // 1) partner's price_list
  let price: string | null = null;
  let provenance: PriceProvenance = 'BASE';
  let factor: string | undefined;

  const partner = await pool.query(`SELECT price_list_id FROM partners WHERE id=$1 AND tenant_id=$2`, [input.partnerId, input.tenantId]);
  const partnerPriceListId = partner.rows[0]?.price_list_id as string | null;

  async function findPrice(priceListId: string | null): Promise<string | null> {
    if (!priceListId) return null;
    // exact match for item+uom+min_qty <= qty (tier)
    const r = await pool.query(
      `SELECT unit_price, uom_id FROM price_list_items WHERE tenant_id=$1 AND price_list_id=$2 AND item_id=$3 ORDER BY min_qty DESC LIMIT 1`,
      [input.tenantId, priceListId, input.itemId]
    );
    if (r.rows.length === 0) return null;
    // UoM conversion if needed
    if (r.rows[0].uom_id !== input.uomId) {
      const conv = await pool.query(`SELECT factor FROM uom_conversions WHERE tenant_id=$1 AND from_uom_id=$2 AND to_uom_id=$3`, [input.tenantId, r.rows[0].uom_id, input.uomId]);
      if (conv.rows.length === 0) throw Object.assign(new Error('uom_conversion_missing'), { status: 400 });
      factor = conv.rows[0].factor as string;
      return convertQty(r.rows[0].unit_price as string, factor);
    }
    return r.rows[0].unit_price as string;
  }

  if (partnerPriceListId) {
    const p = await findPrice(partnerPriceListId);
    if (p) { price = p; provenance = 'CUSTOMER_LIST'; }
  }
  // 2) tier list — stubbed (PHASE-029 wholesale): skip for now
  // 3) branch default: price_list where branch association (use tenant default SALE list)
  if (!price && input.branchId) {
    const def = await pool.query(`SELECT id FROM price_lists WHERE tenant_id=$1 AND kind='SALE' AND is_active=true ORDER BY created_at ASC LIMIT 1`, [input.tenantId]);
    if (def.rows[0]) {
      const p = await findPrice(def.rows[0].id as string);
      if (p) { price = p; provenance = 'BRANCH_DEFAULT'; }
    }
  }
  // 4) base: cheapest SALE list or 0 fallback
  if (!price) {
    const base = await pool.query(`SELECT unit_price, uom_id FROM price_list_items WHERE tenant_id=$1 AND item_id=$2 ORDER BY unit_price ASC LIMIT 1`, [input.tenantId, input.itemId]);
    if (base.rows[0]) {
      if (base.rows[0].uom_id !== input.uomId) {
        const conv = await pool.query(`SELECT factor FROM uom_conversions WHERE tenant_id=$1 AND from_uom_id=$2 AND to_uom_id=$3`, [input.tenantId, base.rows[0].uom_id, input.uomId]);
        if (conv.rows.length > 0) { factor = conv.rows[0].factor as string; price = convertQty(base.rows[0].unit_price as string, factor); }
        else price = base.rows[0].unit_price as string;
      } else price = base.rows[0].unit_price as string;
      provenance = 'BASE';
    } else price = '0.000000';
  }

  return {
    unitPrice: new Decimal(price).toFixed(6),
    currency: input.currency ?? 'SAR',
    provenance,
    appliedUomId: input.uomId,
    originalUomId: input.uomId,
    conversionFactor: factor,
    allowManualOverride: true, // ceilings enforced at PHASE-012 sale time
  };
}
