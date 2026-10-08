import { assertPositive } from '../shared/assert';
import { dayNumber, type LocalDate } from '../shared/local-date';

/** Share of each day's difference the trend absorbs (Hacker's Diet smoothing). */
export const TREND_ALPHA = 0.1;

export interface WeightEntry {
  date: LocalDate;
  kg: number;
}

export interface TrendPoint extends WeightEntry {
  trendKg: number;
}

/**
 * Exponential moving average of daily weights (F03). After a gap of n days the new weight counts as if it had been
 * logged n times: weight 1 − (1 − α)ⁿ.
 */
export function weightTrend(entries: readonly WeightEntry[]): TrendPoint[] {
  const sorted = entries
    .map((entry) => {
      assertPositive({ kg: entry.kg });
      return { ...entry, day: dayNumber(entry.date) };
    })
    .sort((a, b) => a.day - b.day);

  const points: TrendPoint[] = [];
  let previous: { day: number; trendKg: number } | undefined;
  for (const { date, kg, day } of sorted) {
    if (previous && day === previous.day) throw new RangeError(`two weights on ${date}`);
    const trendKg = previous
      ? previous.trendKg + (1 - (1 - TREND_ALPHA) ** (day - previous.day)) * (kg - previous.trendKg)
      : kg;
    points.push({ date, kg, trendKg });
    previous = { day, trendKg };
  }
  return points;
}
