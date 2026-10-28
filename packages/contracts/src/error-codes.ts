/**
 * Error code registry — seed for PHASE-001 (T6).
 * Full catalog lives in docs/api/ERROR_MODEL.md; this enum is the typed source.
 * Each code maps to an HTTP status and a localization key.
 */

export const ErrorCodes = {
  // Validation / client errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  STALE_VERSION: 'STALE_VERSION',
  IMMUTABLE_DOCUMENT: 'IMMUTABLE_DOCUMENT',
  CONFLICT: 'CONFLICT',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  CURSOR_EXPIRED: 'CURSOR_EXPIRED',
  IDEMPOTENCY_KEY_CONFLICT: 'IDEMPOTENCY_KEY_CONFLICT',

  // Invariants / server
  INVARIANT_VIOLATION: 'INVARIANT_VIOLATION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorHttpStatus: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  STALE_VERSION: 409,
  IMMUTABLE_DOCUMENT: 409,
  CONFLICT: 409,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  UNAUTHORIZED: 401,
  RATE_LIMITED: 429,
  CURSOR_EXPIRED: 422,
  IDEMPOTENCY_KEY_CONFLICT: 422,
  INVARIANT_VIOLATION: 500,
  INTERNAL_ERROR: 500,
};

export function isErrorCode(value: string): value is ErrorCode {
  return Object.values(ErrorCodes).includes(value as ErrorCode);
}
