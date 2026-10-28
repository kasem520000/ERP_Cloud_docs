export type TaxTreatment = 'STANDARD_RATED'|'ZERO_RATED'|'EXEMPT'|'OUT_OF_SCOPE'|'REVERSE_CHARGE'|'NOT_SUBJECT';
export type TaxSnapshot = { treatment: TaxTreatment; rate: string; jurisdiction: string; packVersion: string; effectiveFrom: string; effectiveTo?: string; verificationStatus: 'REQUIRES_VERIFICATION'; sourceRef: string };
export type TaxLineInput = { itemId?: string; price: string; qty: string; discount?: string; taxCodeId?: string; jurisdiction: string; docDate: string };
export type TaxSummary = { byTreatment: { treatment: TaxTreatment; rate: string; net: string; tax: string; gross: string }[]; totalNet: string; totalTax: string; totalGross: string };
