import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import Decimal from 'decimal.js';
import { Rate } from '../src/rate.js';

describe('Rate', () => {
  it('creates from valid string up to 8 dp', () => {
    expect(Rate.fromString('3.75260000').toString()).toBe('3.7526');
    expect(Rate.fromString('0.150000').toString()).toBe('0.15');
  });

  it('rejects >8 dp', () => {
    expect(() => Rate.fromString('1.123456789')).toThrow();
  });

  it('percent helper', () => {
    expect(Rate.percent('15').toString()).toBe('0.15');
    expect(Rate.percent(new Decimal(7.5)).toString()).toBe('0.075');
  });

  it('applyTo money', () => {
    const rate = Rate.fromString('3.7526');
    const usd = new Decimal('100');
    expect(rate.applyTo(usd).toString()).toBe('375.26');
  });

  it('multiply/divide', () => {
    const r = Rate.fromString('2');
    expect(r.multiply('3').toString()).toBe('6');
    expect(r.divide('2').toString()).toBe('1');
  });

  it('round', () => {
    expect(Rate.fromString('1.005').round(2).toString()).toBe('1.01');
  });

  it('property: rate * quantity preserves FX conversion identity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }).map(n => (n / 100).toFixed(4)),
        fc.integer({ min: 1, max: 50000 }).map(n => (n / 10000).toFixed(8)),
        (amountStr, rateStr) => {
          const amount = new Decimal(amountStr);
          const rate = Rate.fromString(rateStr);
          const converted = rate.applyTo(amount);
          const reversed = converted.dividedBy(rate.toDecimal());
          const diff = reversed.minus(amount).abs();
          expect(diff.lte(0.00000001)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
