/**
 * BR-003 price resolution precedence (customer price list → tier → branch default → item base)
 * Manual overrides within role ceilings BR-002
 */
export type PriceSource = 'customer_list'|'tier'|'branch_default'|'item_base';
export function resolvePrice(opts:{ customerListPrice?:string; tierPrice?:string; branchDefault?:string; itemBase:string }): { price:string; source: PriceSource }{
  if(opts.customerListPrice) return { price: opts.customerListPrice, source: 'customer_list' };
  if(opts.tierPrice) return { price: opts.tierPrice, source: 'tier' };
  if(opts.branchDefault) return { price: opts.branchDefault, source: 'branch_default' };
  return { price: opts.itemBase, source: 'item_base' };
}
export function isOverrideAllowed(roleCeiling:string, overridePrice:string, resolved:string): boolean{
  // ceiling = max discount allowed; simplified: override must be >= resolved * (1 - ceiling)
  const ceiling=Number(roleCeiling); const over=Number(overridePrice); const res=Number(resolved);
  return over >= res * (1 - ceiling);
}
