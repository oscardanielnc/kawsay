import type { Tone } from '../shared/tone';

/** Strength days in a week (ADR 0020, WHO 2020): 2 or more blue, 1 amber, 0 coral. */
export function strengthDaysZone(days: number): Tone {
  if (days >= 2) return 'green';
  return days === 1 ? 'yellow' : 'red';
}
