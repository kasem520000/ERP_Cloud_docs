/**
 * Rate — FX rates and tax percentages as exact decimals.
 * Storage: numeric(19,8) for FX, numeric(7,4) for percentages.
 * Transport: string matching ^-?\d{1,15}(\.\d{1,8})?$ (rates) / max 4 dp percentages
 * We enforce max 8 dp universally; callers for percentages should validate ≤4 dp if needed.
 */
import Decimal from 'decimal.js';
Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_UP });

const RATE_RE = /^-?\d{1,15}(\.\d{1,8})?$/;
const MAX_DP = 8;

export class Rate {
  private readonly decimal: Decimal;

  private constructor(decimal: Decimal) {
    this.decimal = decimal;
  }

  static fromString(value: string): Rate {
    if (typeof value !== 'string') throw new TypeError('Rate must be a string');
    if (!RATE_RE.test(value)) throw new Error(`Invalid rate string "${value}": must match ${RATE_RE.source}`);
    return new Rate(new Decimal(value));
  }

  static parse(input: string): Rate {
    const t = input.trim().replace(/,/g, '');
    if (t === '' || t === '-' || t === '.') throw new Error(`Cannot parse rate from "${input}"`);
    return Rate.fromString(t);
  }

  static fromDecimal(d: Decimal): Rate {
    if (d.dp() > MAX_DP) throw new Error(`Rate exceeds ${MAX_DP} dp: ${d.toString()}`);
    return new Rate(d);
  }

  static zero(): Rate {
    return new Rate(new Decimal(0));
  }

  static one(): Rate {
    return new Rate(new Decimal(1));
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

  equals(other: Rate): boolean {
    return this.decimal.equals(other.decimal);
  }

  compare(other: Rate): number {
    return this.decimal.comparedTo(other.decimal);
  }

  isZero(): boolean {
    return this.decimal.isZero();
  }

  multiply(factor: string | Decimal | { toDecimal(): Decimal }): Rate {
    const d = factor instanceof Decimal ? factor : typeof factor === 'string' ? new Decimal(factor) : factor.toDecimal();
    return new Rate(this.decimal.times(d));
  }

  divide(divisor: string | Decimal | { toDecimal(): Decimal }): Rate {
    const d = divisor instanceof Decimal ? divisor : typeof divisor === 'string' ? new Decimal(divisor) : divisor.toDecimal();
    if (d.isZero()) throw new Error('Rate division by zero');
    return new Rate(this.decimal.dividedBy(d));
  }

  /** Apply rate to a money decimal: amount * rate */
  applyTo(amount: Decimal): Decimal {
    return amount.times(this.decimal);
  }

  /** Percentage as rate: e.g., 15% = 0.15 — helper */
  static percent(value: string | Decimal): Rate {
    const d = value instanceof Decimal ? value : new Decimal(value);
    return new Rate(d.dividedBy(100));
  }

  round(dp = MAX_DP, rounding: Decimal.Rounding = Decimal.ROUND_HALF_UP): Rate {
    return new Rate(this.decimal.toDecimalPlaces(dp, rounding));
  }
}
