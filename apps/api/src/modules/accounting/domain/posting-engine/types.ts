export type JournalLineSpec = {
  accountId?: string;
  purpose?: string; // resolves via account_purposes
  direction: 'debit' | 'credit';
  amount: string; // decimal string 19,4 >0
  baseAmount?: string; // computed from amount*rate if FX
  partnerId?: string;
  itemId?: string;
  costCenterId?: string;
  taxCodeId?: string;
  memo?: string;
};
export type JournalSpec = {
  source: { docType: string; docId: string; operation: string };
  entryDate: string; // ISO date
  description?: string;
  currency: string; // ISO 4217
  exchangeRate?: string; // required if currency != base
  lines: JournalLineSpec[];
  idempotencyKey?: string;
  tenantId: string;
  baseCurrency: string;
  fiscalPeriodId?: string;
};

export type PostingResult = {
  journalEntryId: string;
  entryNo: string;
  lines: { lineNo: number; accountId: string; debit: string; credit: string; baseAmount: string }[];
};

export type ValidationContext = {
  resolvePurpose: (purpose: string) => Promise<string | null>; // purpose -> accountId
  isAccountPostable: (accountId: string) => Promise<{ postable: boolean; active: boolean; currency?: string | null }>;
  isPeriodOpen: (date: string) => Promise<{ open: boolean; periodId?: string }>;
  getFxRate: (currency: string, date: string) => Promise<string | null>;
  isControlPurpose: (accountId: string) => boolean; // AR/AP control check
  existingEntry?: (sourceType: string, sourceId: string, operation: string) => Promise<string | null>; // idempotency
};
