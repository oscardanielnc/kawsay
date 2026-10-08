import { describe, expect, it } from 'vitest';
import { dayNumber, localDateOf } from './local-date';

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
