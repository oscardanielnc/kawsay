import { assertPositive } from '../shared/assert';
import type { Tone } from '../shared/tone';

const KCAL_PER_GRAM = 4;
/** WHO 2015 guideline on free sugars: under 10% of energy, ideally under 5%. */
const IDEAL_SHARE = 0.05;
const MAX_SHARE = 0.1;

/** Added-sugar ceilings in grams for a day target (F22): green up to 5% of its kcal, yellow up to 10%. */
export function addedSugarLimits(targetKcal: number): { greenMaxG: number; yellowMaxG: number } {
  assertPositive({ targetKcal });
  return {
    greenMaxG: (targetKcal * IDEAL_SHARE) / KCAL_PER_GRAM,
    yellowMaxG: (targetKcal * MAX_SHARE) / KCAL_PER_GRAM,
  };
}

/** Colour of the day's added sugar: limits included in the lower zone. */
export function addedSugarState(
  grams: number,
  { greenMaxG, yellowMaxG }: { greenMaxG: number; yellowMaxG: number },
): Tone {
  if (grams <= greenMaxG) return 'green';
  if (grams <= yellowMaxG) return 'yellow';
  return 'red';
}
