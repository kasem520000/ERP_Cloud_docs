import { describe, it, expect } from 'vitest';
import { CalendarDate } from '../src/calendar-date.js';

describe('CalendarDate', () => {
  it('parses valid ISO dates', () => {
    expect(CalendarDate.fromISO('2026-10-27').toISO()).toBe('2026-10-27');
    expect(CalendarDate.fromISO('2026-02-28').day).toBe(28);
  });

  it('rejects invalid dates', () => {
    expect(() => CalendarDate.fromISO('2026-02-30')).toThrow();
    expect(() => CalendarDate.fromISO('not-a-date')).toThrow();
    expect(() => CalendarDate.fromISO('2026-13-01')).toThrow();
    expect(CalendarDate.tryFromISO('bad')).toBeNull();
  });

  it('converts from Date', () => {
    const d = new Date('2026-10-27T12:00:00Z');
    expect(CalendarDate.fromDate(d).toISO()).toBe('2026-10-27');
  });

  it('comparison helpers', () => {
    const a = CalendarDate.fromISO('2026-01-01');
    const b = CalendarDate.fromISO('2026-01-15');
    expect(a.isBefore(b)).toBe(true);
    expect(b.isAfter(a)).toBe(true);
    expect(a.isOnOrBefore(a)).toBe(true);
    expect(b.isOnOrAfter(a)).toBe(true);
    expect(a.equals(CalendarDate.fromISO('2026-01-01'))).toBe(true);
    expect(a.daysUntil(b)).toBe(14);
  });

  it('addDays/addMonths/addYears', () => {
    const d = CalendarDate.fromISO('2026-01-31');
    expect(d.addDays(1).toISO()).toBe('2026-02-01');
    expect(d.addMonths(1).toISO()).toBe('2026-02-28'); // Jan 31 +1mo → Feb 28
    expect(d.addYears(1).toISO()).toBe('2027-01-31');
  });

  it('leap year handling', () => {
    expect(CalendarDate.fromISO('2024-02-29').toISO()).toBe('2024-02-29');
    expect(() => CalendarDate.fromISO('2023-02-29')).toThrow();
  });

  it('today returns valid date', () => {
    expect(CalendarDate.today().toISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
