import Decimal from 'decimal.js';
Decimal.set({precision:34, rounding: Decimal.ROUND_HALF_UP});
export type Layer={ id:string; remainingQty:string; unitCost:string; createdAt:string };
export function consumeFifo(layers: Layer[], qtyToIssue: string): { consumed:{layerId:string; qty:string}[]; remaining:Layer[] }{
  let need=new Decimal(qtyToIssue); const consumed: {layerId:string; qty:string}[]=[]; const remaining=[...layers];
  for(const l of remaining){ if(need.lte(0)) break; const avail=new Decimal(l.remainingQty); const take=Decimal.min(avail, need); if(take.gt(0)){ consumed.push({layerId:l.id, qty: take.toFixed(4)}); l.remainingQty=avail.minus(take).toFixed(4); need=need.minus(take); } }
  return { consumed, remaining: remaining.filter(l=> new Decimal(l.remainingQty).gt(0)) };
}
export function sumLayerQty(layers:Layer[]): string { return layers.reduce((a,l)=> a.plus(new Decimal(l.remainingQty)), new Decimal(0)).toFixed(4); }
