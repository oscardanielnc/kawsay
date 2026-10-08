import { describe, expect, it } from 'vitest';
import { daySleepHours, sessionHours, sessionStamps } from './sleep-session';

describe('sessionStamps', () => {
  it('a night that crosses midnight starts the evening before the day it counts for', () => {
    expect(sessionStamps('2026-10-08', { start: '23:00', end: '07:00' })).toEqual({
      start: '2026-10-07T23:00',
      end: '2026-10-08T07:00',
    });
  });

  it('a nap stays inside its day', () => {
    expect(sessionStamps('2026-10-08', { start: '14:00', end: '14:30' })).toEqual({
      start: '2026-10-08T14:00',
      end: '2026-10-08T14:30',
    });
  });

  it('a night that starts after midnight stays on the same day', () => {
    expect(sessionStamps('2026-10-08', { start: '00:30', end: '07:00' }).start).toBe(
      '2026-10-08T00:30',
    );
  });

  it('rejects a malformed time', () => {
    expect(() => sessionStamps('2026-10-08', { start: '25:00', end: '07:00' })).toThrow(RangeError);
  });
});

describe('sessionHours', () => {
  it('counts across midnight and month ends', () => {
    expect(sessionHours({ start: '2026-09-30T22:30', end: '2026-10-01T06:00' })).toBe(7.5);
  });

  it('rejects an end before the start', () => {
    expect(() => sessionHours({ start: '2026-10-08T07:00', end: '2026-10-08T06:00' })).toThrow(
      RangeError,
    );
  });
});

describe('daySleepHours', () => {
  it('a night plus a nap show the daily total (F11)', () => {
    const night = sessionStamps('2026-10-08', { start: '23:00', end: '07:00' });
    const nap = sessionStamps('2026-10-08', { start: '14:00', end: '14:30' });
    expect(daySleepHours([night, nap])).toBe(8.5);
  });

  it('no sessions → 0 hours', () => {
    expect(daySleepHours([])).toBe(0);
  });
});
