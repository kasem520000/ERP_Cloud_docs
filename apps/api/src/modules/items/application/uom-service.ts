import Decimal from 'decimal.js';
Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_UP });

export type UomConversion = { fromUomId: string; toUomId: string; factor: string };

/**
 * Validate factor is exact decimal with max 6 dp (quantity precision).
 * Factor must be >0 and string matches ^\d{1,15}(\.\d{1,6})?$
 */
export function validateFactor(factor: string): void {
  if (!/^\d{1,15}(\.\d{1,6})?$/.test(factor)) throw Object.assign(new Error('invalid_factor'), { status: 400 });
  if (new Decimal(factor).lte(0)) throw Object.assign(new Error('factor_must_be_positive'), { status: 400 });
}

/**
 * Compose conversions exactly: product of factors, rounded to 6dp with no drift.
 * Property: chain compose is associative and exact within 6dp.
 */
export function composeFactors(factors: string[]): string {
  let acc = new Decimal(1);
  for (const f of factors) acc = acc.mul(new Decimal(f));
  // quantize to 6dp exact
  return acc.toFixed(6);
}

/**
 * Convert quantity via factor: qty * factor, exact 6dp.
 */
export function convertQty(qty: string, factor: string): string {
  validateFactor(factor);
  if (!/^-?\d{1,15}(\.\d{1,6})?$/.test(qty)) throw Object.assign(new Error('invalid_qty'), { status: 400 });
  return new Decimal(qty).mul(new Decimal(factor)).toFixed(6);
}

/** Check for cycles in conversion graph (simple DFS). Returns true if cycle detected. */
export function hasConversionCycle(conversions: UomConversion[]): boolean {
  const adj = new Map<string, string[]>();
  for (const c of conversions) {
    if (!adj.has(c.fromUomId)) adj.set(c.fromUomId, []);
    adj.get(c.fromUomId)!.push(c.toUomId);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const dfs = (n: string): boolean => {
    if (visiting.has(n)) return true;
    if (visited.has(n)) return false;
    visiting.add(n);
    for (const nb of adj.get(n) ?? []) if (dfs(nb)) return true;
    visiting.delete(n); visited.add(n); return false;
  };
  for (const k of adj.keys()) if (dfs(k)) return true;
  return false;
}
