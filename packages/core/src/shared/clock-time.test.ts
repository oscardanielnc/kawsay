import { describe, expect, it } from 'vitest';
import { minutesOf, shiftTime } from './clock-time';

describe('clock time', () => {
  it('reads minutes since midnight', () => {
    expect(minutesOf('07:30')).toBe(450);
  });

  it('rejects 24:00 and single digits', () => {
    expect(() => minutesOf('24:00')).toThrow(RangeError);
    expect(() => minutesOf('7:30')).toThrow(RangeError);
  });

  it.each([
    ['23:00', 15, '23:15'],
    ['23:45', 15, '00:00'],
    ['00:00', -15, '23:45'],
    ['07:00', -60, '06:00'],
  ] as const)('shifts %s by %d min → %s, around midnight both ways', (time, minutes, expected) => {
    expect(shiftTime(time, minutes)).toBe(expected);
  });
});
