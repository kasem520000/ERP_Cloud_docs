import { describe, it, expect } from 'vitest';
import { DomainError, ValidationError, InvariantViolationError } from '../src/errors.js';

describe('DomainError', () => {
  it('creates with code and details', () => {
    const e = new ValidationError('invalid', { field: 'amount' });
    expect(e.code).toBe('VALIDATION_ERROR');
    expect(e.httpStatus).toBe(422);
    expect(e.details).toEqual({ field: 'amount' });
    expect(e.toJSON().code).toBe('VALIDATION_ERROR');
  });

  it('invariant violation has 500', () => {
    const e = new InvariantViolationError('broken');
    expect(e.httpStatus).toBe(500);
    expect(e.code).toBe('INVARIANT_VIOLATION');
  });

  it('is instance of Error', () => {
    expect(new DomainError({ code: 'X', message: 'y' }) instanceof Error).toBe(true);
  });
});
