// Stable error taxonomy per POSTING_ENGINE.md §3
export type PostingErrorCode =
  | 'ENTRY_NOT_BALANCED'
  | 'PERIOD_LOCKED'
  | 'PERIOD_NOT_FOUND'
  | 'ACCOUNT_NOT_POSTABLE'
  | 'ACCOUNT_ARCHIVED'
  | 'CURRENCY_MISMATCH'
  | 'PURPOSE_NOT_MAPPED'
  | 'MISSING_PARTNER_ON_CONTROL'
  | 'MISSING_FX_RATE'
  | 'ALREADY_POSTED'
  | 'ALREADY_REVERSED'
  | 'INVALID_AMOUNT';

export class PostingError extends Error {
  constructor(public readonly code: PostingErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = 'PostingError';
  }
}
