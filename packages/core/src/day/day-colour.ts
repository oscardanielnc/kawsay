import { rangeState } from './range-state';

export type DayColour = 'green' | 'yellow' | 'red' | 'grey';

export interface DayLog {
  /** Any entry at all that day: meal, weight, check-in, sleep… */
  hasEntries: boolean;
  intakeKcal: number;
  targetKcal: number;
  proteinG: number;
  targetProteinG: number;
  /** At least one activity, or "No physical activity" (F08). */
  activityLogged: boolean;
}

/** Calendar colour of a closed day: count the conditions that fail (F14). */
export function dayColour(day: DayLog): DayColour {
  if (!day.hasEntries) return 'grey';
  const inGreen = (metric: 'calories' | 'protein', value: number, target: number) =>
    rangeState({ metric, value, target, dayOpen: false }) === 'green';
  const failures = [
    !inGreen('calories', day.intakeKcal, day.targetKcal),
    !inGreen('protein', day.proteinG, day.targetProteinG),
    !day.activityLogged,
  ].filter(Boolean).length;
  if (failures === 0) return 'green';
  return failures === 1 ? 'yellow' : 'red';
}
