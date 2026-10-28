/**
 * Money — exact decimal value object over decimal.js.
 * Storage: numeric(19,4) — up to 15 integer digits + 4 decimal places.
 * Transport: JSON string matching ^-?\d{1,15}(\.\d{1,4})?$ (ADR-0009 / API_CONVENTIONS §7)
 *
 * Construction is ONLY via string (or Decimal) — never from JS number directly.
 * This is lint-banned elsewhere; this file is the only sanctioned entry point.
 */

import Decimal from 'decimal.js';

// Configure Decimal for ERP precision: 34 significant digits, half-up default
Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_UP });

const MONEY_RE = /^-?\d{1,15}(\.\d{1,4})?$/;
const MAX_DP = 4;
const MAX_INTEGER_DIGITS = 15;

export class Money {
  private readonly decimal: Decimal;
  public readonly currency: string;

  private constructor(decimal: Decimal, currency: string) {
    this.decimal = decimal;
    this.currency = currency;
  }

  /** Create from canonical decimal string. Validates regex and dp. */
  static fromString(amount: string, currency: string): Money {
    if (typeof amount !== 'string') throw new TypeError('Money amount must be a string (ADR-0009)');
    if (!MONEY_RE.test(amount)) {
      throw new Error(`Invalid money string "${amount}": must match ${MONEY_RE.source} (max ${MAX_DP} dp)`);
    }
    if (!currency || typeof currency !== 'string') throw new Error('Money currency is required');
    const d = new Decimal(amount);
    return new Money(d, currency.toUpperCase());
  }

  /** Parse user input (trims, replaces comma, handles empty). Use for form inputs. */
  static parse(input: string, currency: string): Money {
    const trimmed = input.trim().replace(/,/g, '');
    if (trimmed === '' || trimmed === '-' || trimmed === '.') {
      throw new Error(`Cannot parse money from empty input: "${input}"`);
    }
    return Money.fromString(trimmed, currency);
  }

  /** Internal: from Decimal directly (trusted, e.g., arithmetic results). Allows >4 dp for intermediate calcs. */
  static fromDecimal(decimal: Decimal, currency: string): Money {
    const intDigits = decimal.abs().trunc().toString().replace('-', '').length;
    if (intDigits > MAX_INTEGER_DIGITS) throw new Error(`Money integer part exceeds ${MAX_INTEGER_DIGITS} digits`);
    return new Money(decimal, currency.toUpperCase());
  }

  static zero(currency: string): Money {
    return new Money(new Decimal(0), currency.toUpperCase());
  }

  /** Forbid number construction — force string path. */
  static fromNumber(_n: number, _currency: string): never {
    throw new Error('Money.fromNumber is forbidden: use Money.fromString (ADR-0009). Float construction loses precision.');
  }

  get amount(): Decimal {
    return this.decimal;
  }

  toString(): string {
    return this.decimal.toString();
  }

  /** Fixed 4 dp string for DB / transport canonical form. */
  toFixed(): string {
    return this.decimal.toFixed(MAX_DP);
  }

  toJSON(): string {
    return this.toString();
  }

  equals(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.decimal.equals(other.decimal);
  }

  compare(other: Money): number {
    this.assertSameCurrency(other);
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

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.decimal.plus(other.decimal), this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.decimal.minus(other.decimal), this.currency);
  }

  /** Multiply by a decimal factor (quantity/rate as string or Decimal or Quantity/Rate objects). */
  multiply(factor: string | Decimal | { toDecimal(): Decimal }): Money {
    const d = factor instanceof Decimal ? factor : typeof factor === 'string' ? new Decimal(factor) : factor.toDecimal();
    return new Money(this.decimal.times(d), this.currency);
  }

  divide(divisor: string | Decimal | { toDecimal(): Decimal }): Money {
    const d = divisor instanceof Decimal ? divisor : typeof divisor === 'string' ? new Decimal(divisor) : divisor.toDecimal();
    if (d.isZero()) throw new Error('Money division by zero');
    return new Money(this.decimal.dividedBy(d), this.currency);
  }

  /** Round to currency minor units (2 dp for SAR etc., but we support 4 max). Half-up default. */
  roundToMinorUnits(decimals = 2, rounding: Decimal.Rounding = Decimal.ROUND_HALF_UP): Money {
    return new Money(this.decimal.toDecimalPlaces(decimals, rounding), this.currency);
  }

  /** Round to storage precision (4 dp, half-up) — for posting normalization. */
  roundToStorage(): Money {
    return new Money(this.decimal.toDecimalPlaces(MAX_DP, Decimal.ROUND_HALF_UP), this.currency);
  }

  /** Allocate proportionally (e.g., discount split) — returns array summing to this amount. */
  allocate(ratios: Decimal[]): Money[] {
    if (ratios.length === 0) return [];
    const total = ratios.reduce((a, b) => a.plus(b), new Decimal(0));
    if (total.isZero()) throw new Error('Allocate ratios sum to zero');
    let remainder = this.decimal;
    const results: Money[] = [];
    for (let i = 0; i < ratios.length; i++) {
      if (i === ratios.length - 1) {
        results.push(new Money(remainder, this.currency));
      } else {
        const share = this.decimal.times(ratios[i]!).dividedBy(total).toDecimalPlaces(MAX_DP, Decimal.ROUND_HALF_UP);
        results.push(new Money(share, this.currency));
        remainder = remainder.minus(share);
      }
    }
    return results;
  }

  abs(): Money {
    return new Money(this.decimal.abs(), this.currency);
  }

  neg(): Money {
    return new Money(this.decimal.negated(), this.currency);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
