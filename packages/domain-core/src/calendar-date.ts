/**
 * CalendarDate — a timezone-naive calendar date (YYYY-MM-DD) for business dates.
 * Stored as `date` in Postgres (tenant fiscal calendar semantics).
 * Never carries time; comparisons are lexicographic on ISO string.
 * Used for invoiceDate, dueDate, fiscal periods, etc.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class CalendarDate {
  private readonly iso: string;

  private constructor(iso: string) {
    this.iso = iso;
  }

  static fromISO(iso: string): CalendarDate {
    if (!ISO_DATE_RE.test(iso)) throw new ValidationErrorForDate(`Invalid ISO date: ${iso}`);
    const d = new Date(iso + 'T00:00:00.000Z');
    if (isNaN(d.getTime())) throw new ValidationErrorForDate(`Invalid calendar date: ${iso}`);
    const [y, m, day] = iso.split('-').map(Number);
    if (d.getUTCFullYear() !== y || d.getUTCMonth() + 1 !== m || d.getUTCDate() !== day) {
      throw new ValidationErrorForDate(`Non-existent calendar date: ${iso}`);
    }
    return new CalendarDate(iso);
  }

  static fromDate(date: Date): CalendarDate {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return new CalendarDate(`${y}-${m}-${d}`);
  }

  static today(): CalendarDate {
    return CalendarDate.fromDate(new Date());
  }

  static tryFromISO(iso: string): CalendarDate | null {
    try {
      return CalendarDate.fromISO(iso);
    } catch {
      return null;
    }
  }

  toISO(): string {
    return this.iso;
  }

  toString(): string {
    return this.iso;
  }

  toJSON(): string {
    return this.iso;
  }

  get year(): number {
    return Number(this.iso.slice(0, 4));
  }

  get month(): number {
    return Number(this.iso.slice(5, 7));
  }

  get day(): number {
    return Number(this.iso.slice(8, 10));
  }

  equals(other: CalendarDate): boolean {
    return this.iso === other.iso;
  }

  isBefore(other: CalendarDate): boolean {
    return this.iso < other.iso;
  }

  isAfter(other: CalendarDate): boolean {
    return this.iso > other.iso;
  }

  isOnOrBefore(other: CalendarDate): boolean {
    return this.iso <= other.iso;
  }

  isOnOrAfter(other: CalendarDate): boolean {
    return this.iso >= other.iso;
  }

  addDays(days: number): CalendarDate {
    const d = new Date(this.iso + 'T00:00:00.000Z');
    d.setUTCDate(d.getUTCDate() + days);
    return CalendarDate.fromDate(d);
  }

  addMonths(months: number): CalendarDate {
    const [y, m, d] = this.iso.split('-').map(Number) as [number, number, number];
    let newMonth = m - 1 + months;
    let newYear = y + Math.floor(newMonth / 12);
    newMonth = newMonth % 12;
    if (newMonth < 0) {
      newMonth += 12;
      newYear -= 1;
    }
    // Clamp day to last day of target month
    const lastDay = new Date(Date.UTC(newYear, newMonth + 1, 0)).getUTCDate();
    const newDay = Math.min(d, lastDay);
    const mm = String(newMonth + 1).padStart(2, '0');
    const dd = String(newDay).padStart(2, '0');
    return CalendarDate.fromISO(`${newYear}-${mm}-${dd}`);
  }

  addYears(years: number): CalendarDate {
    const d = new Date(this.iso + 'T00:00:00.000Z');
    d.setUTCFullYear(d.getUTCFullYear() + years);
    return CalendarDate.fromDate(d);
  }

  /** Days between this and other (other - this). Negative if other is before. */
  daysUntil(other: CalendarDate): number {
    const a = new Date(this.iso + 'T00:00:00.000Z').getTime();
    const b = new Date(other.iso + 'T00:00:00.000Z').getTime();
    const diffMs = b - a;
    const days = diffMs / 86400000;
    return days | 0;
  }
}

class ValidationErrorForDate extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalendarDateValidationError';
  }
}
