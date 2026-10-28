import Decimal from 'decimal.js';
Decimal.set({precision:34, rounding: Decimal.ROUND_HALF_UP});
export function computeWac(oldQty: string, oldAvg: string, inQty: string, inCost: string): string {
  const oq=new Decimal(oldQty), oa=new Decimal(oldAvg), iq=new Decimal(inQty), ic=new Decimal(inCost);
  if(oq.plus(iq).equals(0)) return '0.000000';
  const newAvg=oq.mul(oa).plus(iq.mul(ic)).div(oq.plus(iq));
  return newAvg.toFixed(6);
}
export function wacWithinBounds(oldAvg: string, inCost: string, newAvg: string): boolean {
  const oa=new Decimal(oldAvg), ic=new Decimal(inCost), na=new Decimal(newAvg);
  const min=Decimal.min(oa, ic), max=Decimal.max(oa, ic);
  return na.gte(min) && na.lte(max);
}
