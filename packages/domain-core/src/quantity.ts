/**
 * Quantity — exact decimal for stock / item amounts.
 * Storage: numeric(19,6) — max 6 dp.
 * Transport: string matching ^-?\d{1,15}(\.\d{1,6})?$ (API_CONVENTIONS §7)
 */
import Decimal from 'decimal.js';
Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_UP });

const QTY_RE = /^-?\d{1,15}(\.\d{1,6})?$/;
const MAX_DP = 6;
const MAX_INT = 15;

export class Quantity {
  private readonly decimal: Decimal;

  private constructor(decimal: Decimal) {
    this.decimal = decimal;
  }

  static fromString(value: string): Quantity {
    if (typeof value !== 'string') throw new TypeError('Quantity must be a string');
    if (!QTY_RE.test(value)) throw new Error(`Invalid quantity string "${value}": must match ${QTY_RE.source}`);
    return new Quantity(new Decimal(value));
  }

  static parse(input: string): Quantity {
    const t = input.trim().replace(/,/g, '');
    if (t === '' || t === '-' || t === '.') throw new Error(`Cannot parse quantity from "${input}"`);
    return Quantity.fromString(t);
  }

  static fromDecimal(d: Decimal): Quantity {
    if (d.dp() > MAX_DP) throw new Error(`Quantity exceeds ${MAX_DP} dp: ${d.toString()}`);
    const intDigits = d.abs().trunc().toString().replace('-', '').length;
    if (intDigits > MAX_INT) throw new Error(`Quantity integer part exceeds ${MAX_INT} digits`);
    return new Quantity(d);
  }

  static zero(): Quantity {
    return new Quantity(new Decimal(0));
  }

  static one(): Quantity {
    return new Quantity(new Decimal(1));
  }

  static fromNumber(_n: number): never {
    throw new Error('Quantity.fromNumber is forbidden: use fromString');
  }

  toDecimal(): Decimal {
    return this.decimal;
  }

  toString(): string {
    return this.decimal.toString();
  }

  toJSON(): string {
    return this.toString();
  }

  equals(other: Quantity): boolean {
    return this.decimal.equals(other.decimal);
  }

  compare(other: Quantity): number {
    return this.decimal.comparedTo(other.decimal);
  }

  isZero(): boolean {
    return this.decimal.isZero();
  }

  isPositive(): boolean {
    return this.decimal.gt(0);
  }

  isNegative(): boolean {
    return this.decimal.lt(0);
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.decimal.plus(other.decimal));
  }

  subtract(other: Quantity): Quantity {
    return new Quantity(this.decimal.minus(other.decimal));
  }

  multiply(factor: string | Decimal | { toDecimal(): Decimal }): Quantity {
    const d = factor instanceof Decimal ? factor : typeof factor === 'string' ? new Decimal(factor) : factor.toDecimal();
    return new Quantity(this.decimal.times(d));
  }

  divide(divisor: string | Decimal | { toDecimal(): Decimal }): Quantity {
    const d = divisor instanceof Decimal ? divisor : typeof divisor === 'string' ? new Decimal(divisor) : divisor.toDecimal();
    if (d.isZero()) throw new Error('Quantity division by zero');
    return new Quantity(this.decimal.dividedBy(d));
  }

  abs(): Quantity {
    return new Quantity(this.decimal.abs());
  }

  neg(): Quantity {
    return new Quantity(this.decimal.negated());
  }

  round(dp = MAX_DP, rounding: Decimal.Rounding = Decimal.ROUND_HALF_UP): Quantity {
    return new Quantity(this.decimal.toDecimalPlaces(dp, rounding));
  }
}
