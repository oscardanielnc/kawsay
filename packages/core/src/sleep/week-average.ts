import type { Tone } from '../shared/tone';

/**
 * Week's average sleep per day, night and naps (F11, ADR 0020; National Sleep Foundation 2015): days without a sleep
 * log are left out, a week without any is null ("sin dato"). 7–9 h blue, 6–7 or 9–10 h amber, otherwise coral.
 */
export function weekSleepAverage(
  dayHours: readonly (number | null)[],
): { hours: number; zone: Tone } | null {
  const logged = dayHours.filter((h): h is number => h !== null);
  if (logged.length === 0) return null;
  const hours = logged.reduce((sum, h) => sum + h, 0) / logged.length;
  const zone: Tone =
    hours >= 7 && hours <= 9 ? 'green' : hours >= 6 && hours <= 10 ? 'yellow' : 'red';
  return { hours, zone };
}
