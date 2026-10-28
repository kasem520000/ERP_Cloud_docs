import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import Decimal from 'decimal.js';
import { Money } from '../src/money.js';
import { Quantity } from '../src/quantity.js';

describe('Money', () => {
  it('creates from valid string', () => {
    const m = Money.fromString('1234.5000', 'SAR');
    expect(m.toString()).toBe('1234.5');
    expect(m.currency).toBe('SAR');
    expect(m.toFixed()).toBe('1234.5000');
  });

  it('normalizes currency to uppercase', () => {
    expect(Money.fromString('10', 'sar').currency).toBe('SAR');
  });

  it('rejects float construction via fromNumber', () => {
    expect(() => Money.fromNumber(123.45 as never, 'SAR')).toThrow(/forbidden/);
  });

  it('rejects invalid patterns', () => {
    expect(() => Money.fromString('12.12345', 'SAR')).toThrow(); // 5 dp
    expect(() => Money.fromString('abc', 'SAR')).toThrow();
    expect(() => Money.fromString('1234567890123456', 'SAR')).toThrow(); // 16 int digits
    expect(() => Money.fromString('1.00', '')).toThrow();
  });

  it('rejects missing currency', () => {
    expect(() => Money.fromString('10', '' as never)).toThrow();
  });

  it('parses user input with commas', () => {
    expect(Money.parse('1,234.50', 'SAR').toString()).toBe('1234.5');
    expect(Money.parse('  10.00  ', 'USD').toString()).toBe('10');
  });

  it('add', () => {
    const a = Money.fromString('100.25', 'SAR');
    const b = Money.fromString('200.75', 'SAR');
    expect(a.add(b).toString()).toBe('301');
    expect(a.add(b).currency).toBe('SAR');
  });

  it('subtract', () => {
    const a = Money.fromString('500', 'SAR');
    const b = Money.fromString('123.1234', 'SAR');
    expect(a.subtract(b).toString()).toBe('376.8766');
  });

  it('rejects currency mismatch on add', () => {
    const a = Money.fromString('10', 'SAR');
    const b = Money.fromString('10', 'USD');
    expect(() => a.add(b)).toThrow(/Currency mismatch/);
  });

  it('multiply by quantity string', () => {
    const price = Money.fromString('33.33', 'SAR');
    const qty = Quantity.fromString('3');
    expect(price.multiply(qty).toString()).toBe('99.99');
  });

  it('multiply by Decimal rate', () => {
    const net = Money.fromString('100.00', 'SAR');
    const rate = new Decimal('0.15');
    expect(net.multiply(rate).toString()).toBe('15');
  });

  it('divide', () => {
    const m = Money.fromString('100', 'SAR');
    expect(m.divide('4').toString()).toBe('25');
    expect(() => m.divide('0')).toThrow(/zero/);
  });

  it('rounding half-up to minor units (2 dp)', () => {
    expect(Money.fromString('14.9985', 'SAR').roundToMinorUnits(2).toString()).toBe('15');
    expect(Money.fromString('1.0050', 'SAR').roundToMinorUnits(2).toString()).toBe('1.01');
    expect(Money.fromString('1.0049', 'SAR').roundToMinorUnits(2).toString()).toBe('1');
  });

  it('roundToStorage preserves 4 dp half-up', () => {
    const intermediate = Money.fromDecimal(new Decimal('1.00005'), 'SAR');
    expect(intermediate.roundToStorage().toString()).toBe('1.0001');
  });

  it('zero and sign checks', () => {
    expect(Money.zero('SAR').isZero()).toBe(true);
    expect(Money.fromString('10', 'SAR').isPositive()).toBe(true);
    expect(Money.fromString('-5', 'SAR').isNegative()).toBe(true);
    expect(Money.fromString('-5', 'SAR').abs().toString()).toBe('5');
    expect(Money.fromString('5', 'SAR').neg().toString()).toBe('-5');
  });

  it('equals and compare', () => {
    const a = Money.fromString('10.00', 'SAR');
    const b = Money.fromString('10', 'SAR');
    const c = Money.fromString('11', 'SAR');
    expect(a.equals(b)).toBe(true);
    expect(a.compare(c)).toBe(-1);
    expect(c.compare(a)).toBe(1);
    expect(a.compare(b)).toBe(0);
  });

  it('allocate splits proportionally summing to original', () => {
    const total = Money.fromString('100.00', 'SAR');
    const parts = total.allocate([new Decimal(1), new Decimal(1), new Decimal(1)]);
    expect(parts.length).toBe(3);
    const sum = parts.reduce((a, p) => a.add(p), Money.zero('SAR'));
    expect(sum.equals(total)).toBe(true);
  });

  it('string parse rejects float construction path', () => {
    expect(() => Money.fromString(123.45 as unknown as string, 'SAR')).toThrow();
  });

  it('property: add is commutative', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true }).map(n => new Decimal(n).toFixed(4)),
        fc.double({ min: -1e6, max: 1e6, noNaN: true }).map(n => new Decimal(n).toFixed(4)),
        (aStr, bStr) => {
          const a = Money.fromString(aStr, 'SAR');
          const b = Money.fromString(bStr, 'SAR');
          expect(a.add(b).toString()).toBe(b.add(a).toString());
        },
      ),
      { numRuns: 100 },
    );
  });

  it('property: add/subtract are inverses', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e6, noNaN: true }).map(n => new Decimal(n).toFixed(4)),
        fc.double({ min: 0, max: 1e6, noNaN: true }).map(n => new Decimal(n).toFixed(4)),
        (aStr, bStr) => {
          const a = Money.fromString(aStr, 'SAR');
          const b = Money.fromString(bStr, 'SAR');
          expect(a.add(b).subtract(b).equals(a)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('property: multiply by quantity then divide recovers (within 4dp rounding)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }).map(n => (n / 100).toFixed(4)),
        fc.integer({ min: 1, max: 1000 }).map(n => (n / 100).toFixed(6)),
        (priceStr, qtyStr) => {
          const price = Money.fromString(priceStr, 'SAR');
          const qty = Quantity.fromString(qtyStr);
          const line = price.multiply(qty);
          const recovered = line.divide(qty);
          const diff = new Decimal(recovered.toString()).minus(new Decimal(price.toString())).abs();
          expect(diff.lte(0.0001)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
