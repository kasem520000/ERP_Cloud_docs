import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Quantity } from '../src/quantity.js';

describe('Quantity', () => {
  it('creates from valid string up to 6 dp', () => {
    expect(Quantity.fromString('12.500000').toString()).toBe('12.5');
    expect(Quantity.fromString('0.000001').toString()).toBe('0.000001');
  });

  it('rejects >6 dp', () => {
    expect(() => Quantity.fromString('1.0000001')).toThrow();
  });

  it('rejects fromNumber', () => {
    expect(() => Quantity.fromNumber(5 as never)).toThrow(/forbidden/);
  });

  it('add/sub/mul/div', () => {
    const a = Quantity.fromString('10.5');
    const b = Quantity.fromString('2.5');
    expect(a.add(b).toString()).toBe('13');
    expect(a.subtract(b).toString()).toBe('8');
    expect(a.multiply('2').toString()).toBe('21');
    expect(a.divide('2').toString()).toBe('5.25');
    expect(() => a.divide('0')).toThrow();
  });

  it('abs/neg/equals/compare', () => {
    expect(Quantity.fromString('-5').abs().toString()).toBe('5');
    expect(Quantity.fromString('5').neg().toString()).toBe('-5');
    expect(Quantity.fromString('10').equals(Quantity.fromString('10.000000'))).toBe(true);
    expect(Quantity.fromString('5').compare(Quantity.fromString('10'))).toBe(-1);
  });

  it('zero/one', () => {
    expect(Quantity.zero().isZero()).toBe(true);
    expect(Quantity.one().toString()).toBe('1');
  });

  it('property: quantity arithmetic is associative for add', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }).map(n => (n / 1000).toFixed(6)),
        fc.integer({ min: 0, max: 100000 }).map(n => (n / 1000).toFixed(6)),
        fc.integer({ min: 0, max: 100000 }).map(n => (n / 1000).toFixed(6)),
        (aStr, bStr, cStr) => {
          const a = Quantity.fromString(aStr);
          const b = Quantity.fromString(bStr);
          const c = Quantity.fromString(cStr);
          expect(a.add(b).add(c).toString()).toBe(a.add(b.add(c)).toString());
        },
      ),
      { numRuns: 100 },
    );
  });
});
