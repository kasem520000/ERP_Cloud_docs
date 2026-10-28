import { describe, it, expect } from 'vitest';
import { registry, HealthLiveResponseSchema } from '../src/registry.js';
import { ErrorCodes, isErrorCode } from '../src/error-codes.js';
import { MoneyStringSchema, UuidV7Schema } from '../src/money-schemas.js';

describe('contracts registry v0', () => {
  it('registry contains HealthLiveResponse', () => {
    expect(registry.has('HealthLiveResponse')).toBe(true);
    expect(registry.count()).toBeGreaterThanOrEqual(1);
  });

  it('HealthLiveResponse validates', () => {
    expect(() => HealthLiveResponseSchema.parse({ status: 'ok', build: { version: '0.1.0' } })).not.toThrow();
    expect(() => HealthLiveResponseSchema.parse({ status: 'fail' })).toThrow();
  });

  it('error codes are stable', () => {
    expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(isErrorCode('VALIDATION_ERROR')).toBe(true);
    expect(isErrorCode('UNKNOWN')).toBe(false);
  });

  it('money string schema rejects numbers and excess dp', () => {
    expect(MoneyStringSchema.safeParse('1234.5000').success).toBe(true);
    expect(MoneyStringSchema.safeParse('1234.50000').success).toBe(false);
    expect(MoneyStringSchema.safeParse(1234).success).toBe(false);
  });

  it('uuidv7 schema validates version bits', () => {
    expect(UuidV7Schema.safeParse('019405f7-2d6a-71a5-8e3b-123456789abc').success).toBe(true);
    expect(UuidV7Schema.safeParse('not-a-uuid').success).toBe(false);
  });
});
