import Decimal from 'decimal.js';
import type { TaxSnapshot, TaxSummary, TaxTreatment } from '@erp/contracts/src/tax/index.js';
export type RateRow = { treatment: string; rate: string; effectiveFrom: string; effectiveTo?: string|null; sourceRef: string; packVersion: string };
export function resolveLine(input:{ amount:string; taxCode:{ treatment:string; rate:string; jurisdiction:string; packVersion:string; sourceRef:string }; minorUnits:number; registrationStatus: 'REGISTERED'|'NOT_REGISTERED'|'NO_VAT' }): { tax: string; snapshot: TaxSnapshot }{
  if(input.registrationStatus==='NOT_REGISTERED' || input.registrationStatus==='NO_VAT'){
    return { tax: '0.00', snapshot: { treatment:'NOT_SUBJECT', rate:'0.0000', jurisdiction: input.taxCode.jurisdiction, packVersion: input.taxCode.packVersion, effectiveFrom: input.taxCode.packVersion, verificationStatus:'REQUIRES_VERIFICATION', sourceRef: input.taxCode.sourceRef } };
  }
  const gross=new Decimal(input.amount); const rate=new Decimal(input.taxCode.rate);
  const tax=gross.mul(rate).toDecimalPlaces(input.minorUnits, Decimal.ROUND_HALF_UP).toFixed(input.minorUnits===3 ? 3 : 2);
  const snap: TaxSnapshot={ treatment: input.taxCode.treatment as TaxTreatment, rate: input.taxCode.rate, jurisdiction: input.taxCode.jurisdiction, packVersion: input.taxCode.packVersion, effectiveFrom: '2026-01-01', verificationStatus:'REQUIRES_VERIFICATION', sourceRef: input.taxCode.sourceRef };
  return { tax, snapshot: snap };
}
export function summarize(lines:{ net:string; tax:string }[]): TaxSummary{
  const totNet=lines.reduce((a,l)=> a.plus(new Decimal(l.net)), new Decimal(0)); const totTax=lines.reduce((a,l)=> a.plus(new Decimal(l.tax)), new Decimal(0));
  return { byTreatment:[{treatment:'STANDARD_RATED', rate:'0.1500', net: totNet.toFixed(2), tax: totTax.toFixed(2), gross: totNet.plus(totTax).toFixed(2)}], totalNet: totNet.toFixed(2), totalTax: totTax.toFixed(2), totalGross: totNet.plus(totTax).toFixed(2) };
}
export function extractInclusive(gross:string, rate:string, minorUnits:number): { net:string; tax:string }{
  const g=new Decimal(gross); const r=new Decimal(rate);
  const net=g.div(r.plus(1)).toDecimalPlaces(minorUnits, Decimal.ROUND_HALF_UP); const tax=g.minus(net).toDecimalPlaces(minorUnits, Decimal.ROUND_HALF_UP);
  return { net: net.toFixed(minorUnits===3?3:2), tax: tax.toFixed(minorUnits===3?3:2) };
}
