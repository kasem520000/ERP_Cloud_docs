/**
 * Domain error hierarchy — base class for all domain failures.
 * Each error carries a stable code (for contracts/error-codes) and optional details.
 * PHASE-001 provides the base; later phases extend with specific codes.
 */

export type ErrorDetails = Record<string, unknown> | undefined;

export class DomainError extends Error {
  public readonly code: string;
  public readonly details?: ErrorDetails;
  public readonly httpStatus?: number;

  constructor(opts: { code: string; message: string; details?: ErrorDetails; httpStatus?: number }) {
    super(opts.message);
    this.name = this.constructor.name;
    this.code = opts.code;
    this.details = opts.details;
    this.httpStatus = opts.httpStatus;
    // Maintains proper stack trace (V8)
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): { code: string; message: string; details?: ErrorDetails } {
    return { code: this.code, message: this.message, details: this.details };
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: ErrorDetails) {
    super({ code: 'VALIDATION_ERROR', message, details, httpStatus: 422 });
    this.name = 'ValidationError';
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string, details?: ErrorDetails) {
    super({ code: 'INVARIANT_VIOLATION', message, details, httpStatus: 500 });
    this.name = 'InvariantViolationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, details?: ErrorDetails) {
    super({ code: 'NOT_FOUND', message, details, httpStatus: 404 });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: ErrorDetails) {
    super({ code: 'CONFLICT', message, details, httpStatus: 409 });
    this.name = 'ConflictError';
  }
}
