import { describe, expect, it } from 'vitest';
import { clockHours, daySleepHours, sessionHours, sessionStamps } from './sleep-session';

describe('sessionStamps', () => {
  it('a night that crosses midnight starts the evening before the day it counts for', () => {
    expect(sessionStamps('2026-10-08', { kind: 'night', start: '23:00', end: '07:00' })).toEqual({
      start: '2026-10-07T23:00',
      end: '2026-10-08T07:00',
    });
  });

  it('a nap stays inside its day', () => {
    expect(sessionStamps('2026-10-08', { kind: 'nap', start: '14:00', end: '14:30' })).toEqual({
      start: '2026-10-08T14:00',
      end: '2026-10-08T14:30',
    });
  });

  it('a night that starts after midnight stays on the same day', () => {
    expect(sessionStamps('2026-10-08', { kind: 'night', start: '00:30', end: '07:00' }).start).toBe(
      '2026-10-08T00:30',
    );
  });

  it('rejects a malformed time', () => {
    expect(() =>
      sessionStamps('2026-10-08', { kind: 'night', start: '25:00', end: '07:00' }),
    ).toThrow(RangeError);
  });
});

describe('sessionHours', () => {
  it('counts across midnight and month ends', () => {
    expect(sessionHours({ start: '2026-09-30T22:30', end: '2026-10-01T06:00' })).toBe(7.5);
  });

  it('an end before the start counts 0 hours until it is fixed', () => {
    expect(sessionHours({ start: '2026-10-08T07:00', end: '2026-10-08T06:00' })).toBe(0);
  });
});

describe('an end earlier than the start (F11)', () => {
  it('a nap 14:00 → 13:30 stays on its day and counts 0 hours', () => {
    const nap = { kind: 'nap', start: '14:00', end: '13:30' } as const;
    expect(sessionStamps('2026-10-08', nap)).toEqual({
      start: '2026-10-08T14:00',
      end: '2026-10-08T13:30',
    });
    expect(clockHours(nap)).toBe(0);
  });

  it('a night 07:00 → 06:00 is a time still being entered, not a 23-hour night', () => {
    const night = { kind: 'night', start: '07:00', end: '06:00' } as const;
    expect(sessionStamps('2026-10-08', night).start).toBe('2026-10-08T07:00');
    expect(clockHours(night)).toBe(0);
  });

  it('a night 23:00 → 07:00 still crosses midnight: 8 hours', () => {
    expect(clockHours({ kind: 'night', start: '23:00', end: '07:00' })).toBe(8);
  });
});

describe('daySleepHours', () => {
  it('a night plus a nap show the daily total (F11)', () => {
    const night = sessionStamps('2026-10-08', { kind: 'night', start: '23:00', end: '07:00' });
    const nap = sessionStamps('2026-10-08', { kind: 'nap', start: '14:00', end: '14:30' });
    expect(daySleepHours([night, nap])).toBe(8.5);
  });

  it('never adds up to more than a day', () => {
    const night = sessionStamps('2026-10-08', { kind: 'night', start: '12:00', end: '11:45' });
    const nap = sessionStamps('2026-10-08', { kind: 'nap', start: '14:00', end: '16:00' });
    expect(daySleepHours([night, nap])).toBe(24);
  });

  it('no sessions → 0 hours', () => {
    expect(daySleepHours([])).toBe(0);
  });
});
