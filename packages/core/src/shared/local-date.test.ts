import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  dayNumber,
  daysBetween,
  localDateOf,
  monthDays,
  weekStart,
  weekday,
} from './local-date';

describe('localDateOf: the calendar day in the device time zone (ADR 0016)', () => {
  it('a meal at 22:00 in Lima stays on that day, although UTC is already the next one', () => {
    const tenPmLima = new Date('2026-10-08T03:00:00Z');
    expect(localDateOf(tenPmLima, 'America/Lima')).toBe('2026-10-07');
  });

  it('just before midnight in Lima is still the same day; midnight starts the next', () => {
    expect(localDateOf(new Date('2026-10-08T04:59:59Z'), 'America/Lima')).toBe('2026-10-07');
    expect(localDateOf(new Date('2026-10-08T05:00:00Z'), 'America/Lima')).toBe('2026-10-08');
  });

  it('follows the zone the phone is in when travelling', () => {
    expect(localDateOf(new Date('2026-10-07T16:00:00Z'), 'Asia/Tokyo')).toBe('2026-10-08');
  });

  it('applies daylight saving where the zone has it', () => {
    // New York is UTC−4 in summer: 03:30Z on 1 July is still 30 June there.
    expect(localDateOf(new Date('2026-07-01T03:30:00Z'), 'America/New_York')).toBe('2026-06-30');
  });

  it('rejects an unknown time zone', () => {
    expect(() => localDateOf(new Date(), 'Mars/Olympus')).toThrow(RangeError);
  });
});

describe('dayNumber', () => {
  it('counts calendar days, so consecutive dates differ by exactly one', () => {
    expect(dayNumber('2026-11-01') - dayNumber('2026-10-31')).toBe(1);
  });

  it.each(['2026-13-01', '2026-02-30', '7/10/2026'])('rejects %s', (date) => {
    expect(() => dayNumber(date)).toThrow(RangeError);
  });
});

describe('addDays and daysBetween', () => {
  it('moves across months and years by calendar days', () => {
    expect(addDays('2026-10-07', 84)).toBe('2026-12-30');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts the days from one date to another', () => {
    expect(daysBetween('2026-10-07', '2026-12-30')).toBe(84);
    expect(daysBetween('2026-12-30', '2026-10-07')).toBe(-84);
  });
});

describe('months and weeks (F14 calendar, F04 weekly waist)', () => {
  it('1 October 2026 is a Thursday; weeks start on Monday', () => {
    expect(weekday('2026-10-01')).toBe(3);
    expect(weekday('2026-10-05')).toBe(0);
    expect(weekday('2026-10-11')).toBe(6);
  });

  it('a month lists its days, leap February included', () => {
    expect(monthDays('2026-10')).toHaveLength(31);
    expect(monthDays('2028-02').at(-1)).toBe('2028-02-29');
    expect(() => monthDays('2026-13')).toThrow(RangeError);
  });

  it('months move across years', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('the week of a Sunday starts on the Monday before', () => {
    expect(weekStart('2026-10-11')).toBe('2026-10-05');
    expect(weekStart('2026-10-05')).toBe('2026-10-05');
  });
});
