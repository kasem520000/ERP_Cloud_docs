/**
 * VAT recoverability per TAX_ENGINE §2 + jurisdiction pack
 * REGISTERED + STANDARD_RATED -> VAT_RECOVERABLE
 * EXEMPT/ZERO input related to exempt supplies -> VAT_EXPENSED
 * NOT_REGISTERED / NO_VAT -> NOT_SUBJECT no VAT lines
 */
import Decimal from 'decimal.js';
export type Recovery = 'VAT_RECOVERABLE'|'VAT_EXPENSED'|'NOT_SUBJECT';
export function resolveRecoverability(treatment:string, registrationStatus:string): Recovery {
  if(registrationStatus==='NOT_REGISTERED' || registrationStatus==='NO_VAT') return 'NOT_SUBJECT';
  if(treatment==='EXEMPT') return 'VAT_EXPENSED';
  if(treatment==='STANDARD_RATED' || treatment==='ZERO_RATED') return 'VAT_RECOVERABLE';
  return 'VAT_EXPENSED';
}
export function computeVat(amount:string, rate:string): string {
  return new Decimal(amount).mul(new Decimal(rate)).toFixed(4);
}
