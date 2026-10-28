/**
 * BR-009 three-way matching domain
 * Tolerance: qty_tolerance_pct, price_tolerance_pct exact by default
 * match_result per-line outcomes + dispositions stored before approval
 */
export type MatchInput = { poQty: string; poPrice: string; grnQty: string; invQty: string; invPrice: string; qtyTolPct: number; priceTolPct: number };
export type MatchOutcome = 'MATCH'|'QTY_VARIANCE'|'PRICE_VARIANCE'|'BOTH_VARIANCE';
export function evaluateLine(i: MatchInput): { outcome: MatchOutcome; qtyVariance: string; priceVariance: string; withinTolerance: boolean } {
  const poPrice=Number(i.poPrice), grnQty=Number(i.grnQty), invQty=Number(i.invQty), invPrice=Number(i.invPrice); void i.poQty;
  const qtyVar = ((invQty - grnQty)/ (grnQty||1))*100;
  const priceVar = ((invPrice - poPrice)/ (poPrice||1))*100;
  const qtyWithin = Math.abs(qtyVar) <= i.qtyTolPct;
  const priceWithin = Math.abs(priceVar) <= i.priceTolPct;
  let outcome: MatchOutcome='MATCH';
  if(!qtyWithin && !priceWithin) outcome='BOTH_VARIANCE';
  else if(!qtyWithin) outcome='QTY_VARIANCE';
  else if(!priceWithin) outcome='PRICE_VARIANCE';
  return { outcome, qtyVariance: qtyVar.toFixed(2), priceVariance: priceVar.toFixed(2), withinTolerance: qtyWithin && priceWithin };
}

export function isMatchBlocked(outcomes: {outcome:MatchOutcome}[], tolerant: boolean): boolean {
  if(tolerant) return false;
  return outcomes.some(o=> o.outcome!=='MATCH');
}
