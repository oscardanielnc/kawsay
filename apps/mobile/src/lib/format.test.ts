import { formatDuration } from './format';

describe('formatDuration (hours read like a person says them)', () => {
  it('8.25 h reads "8h 15m"', () => {
    expect(formatDuration(8.25)).toBe('8h 15m');
  });

  it('whole hours drop the minutes; under an hour drops the hours', () => {
    expect(formatDuration(9)).toBe('9h');
    expect(formatDuration(0.5)).toBe('30m');
  });

  it('rounds to the minute, carrying into the hour', () => {
    expect(formatDuration(7.999)).toBe('8h');
    expect(formatDuration(6 + 7 / 60)).toBe('6h 07m');
  });
});
