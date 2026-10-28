export type Layer={ id:string; remainingQty:string; unitCost:string; createdAt:string };
export function consumeFifo(layers: Layer[], qtyToIssue: string): { consumed:{layerId:string; qty:string}[]; remaining:Layer[] }{
  let need=Number(qtyToIssue); const consumed: {layerId:string; qty:string}[]=[]; const remaining=[...layers];
  for(const l of remaining){ if(need<=0) break; const avail=Number(l.remainingQty); const take=Math.min(avail, need); if(take>0){ consumed.push({layerId:l.id, qty: String(take)}); l.remainingQty=String(avail-take); need-=take; } }
  return { consumed, remaining: remaining.filter(l=> Number(l.remainingQty)>0) };
}
export function sumLayerQty(layers:Layer[]): string { return layers.reduce((a,l)=> a + Number(l.remainingQty),0).toFixed(4); }
