import type { DayColour } from '../day/day-colour';

/** One day of the week as the summary needs it. */
export interface WeekDay {
  colour: DayColour;
  movementMinutes: number;
  /** Weight trend that day (F03), null before the first weight. */
  trendKg: number | null;
  /** A weight was logged that day. */
  weighed: boolean;
}

/** WHO: 150–300 minutes of moderate activity a week. */
export const WEEKLY_MOVEMENT_GOAL_MIN = 150;
/** Fewer weights than this and the weekly change is noise. */
const MIN_WEIGHTS = 3;

export type WeekWeight =
  { kind: 'change'; changeKg: number } | { kind: 'need-more'; weights: number };

/** The week at a glance (F20): days by colour, movement minutes vs 150 and the weight trend change. */
export function weeklySummary(days: readonly WeekDay[]): {
  days: Record<DayColour, number>;
  movement: { minutes: number; goalMinutes: number };
  weight: WeekWeight;
} {
  const counts: Record<DayColour, number> = { green: 0, yellow: 0, red: 0, grey: 0 };
  for (const d of days) counts[d.colour] += 1;
  const weighed = days.filter((d) => d.weighed && d.trendKg !== null);
  const first = weighed[0]?.trendKg;
  const last = weighed.at(-1)?.trendKg;
  const weight: WeekWeight =
    weighed.length >= MIN_WEIGHTS && first != null && last != null
      ? { kind: 'change', changeKg: last - first }
      : { kind: 'need-more', weights: weighed.length };
  return {
    days: counts,
    movement: {
      minutes: days.reduce((sum, d) => sum + d.movementMinutes, 0),
      goalMinutes: WEEKLY_MOVEMENT_GOAL_MIN,
    },
    weight,
  };
}
