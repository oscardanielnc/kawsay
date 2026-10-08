import { addDays, type LocalDate } from '@kawsay/core/shared/local-date';
import type { Waist } from './waist-db';

/**
 * The chart's weeks (Mondays) ending at `lastWeek`, and the runs of consecutive measured weeks: a week without a
 * measurement breaks the line instead of drawing a zero (F04).
 */
export function waistSegments(
  waists: readonly Waist[],
  lastWeek: LocalDate,
  weeks: number,
): { weeks: LocalDate[]; segments: Waist[][] } {
  const all = Array.from({ length: weeks }, (_, i) => addDays(lastWeek, -7 * (weeks - 1 - i)));
  const byWeek = new Map(waists.map((w) => [w.weekStart, w]));
  const segments: Waist[][] = [];
  let run: Waist[] = [];
  for (const week of all) {
    const w = byWeek.get(week);
    if (w) run.push(w);
    else if (run.length) {
      segments.push(run);
      run = [];
    }
  }
  if (run.length) segments.push(run);
  return { weeks: all, segments };
}
