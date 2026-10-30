import { addedSugarLimits, addedSugarState } from '../day/added-sugar';
import type { Tone } from '../shared/tone';

/**
 * The sugar block of the Liver card (F25): the week's daily average of added sugar against the 5% and 10% limits of
 * the target, one bar per day coloured by its zone, and the day that added most (its index in the week).
 */
export function weekSugar(
  dailyGrams: readonly number[],
  targetKcal: number,
): {
  averageG: number;
  zone: Tone;
  idealG: number;
  maxG: number;
  days: { grams: number; zone: Tone }[];
  topDay: number | null;
} {
  const limits = addedSugarLimits(targetKcal);
  const averageG = dailyGrams.length
    ? dailyGrams.reduce((sum, g) => sum + g, 0) / dailyGrams.length
    : 0;
  const top = dailyGrams.reduce<number | null>(
    (best, g, i) => (g > 0 && (best === null || g > dailyGrams[best]!) ? i : best),
    null,
  );
  return {
    averageG,
    zone: addedSugarState(averageG, limits),
    idealG: limits.greenMaxG,
    maxG: limits.yellowMaxG,
    days: dailyGrams.map((grams) => ({ grams, zone: addedSugarState(grams, limits) })),
    topDay: top,
  };
}
