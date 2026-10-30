import { assertPositive } from '../shared/assert';
import type { Tone } from '../shared/tone';

/**
 * The personal ceiling of refined flours (F24) as a share of the day's carbohydrate target. No guideline gives a
 * number (US DGA 2025–2030 only says "minimise"), so it is the user's own limit, never a health threshold.
 */
export const DEFAULT_REFINED_FLOUR_SHARE = 0.5;
/** Amber reaches this multiple of the limit; above it, coral. */
const AMBER_UP_TO = 1.5;

/** Refined-flour carbohydrate limits in grams: blue up to `limitG`, amber up to `maxG`. */
export function refinedFlourLimits(
  carbsTargetG: number,
  share: number = DEFAULT_REFINED_FLOUR_SHARE,
): { limitG: number; maxG: number } {
  assertPositive({ carbsTargetG });
  if (!(share >= 0.1 && share <= 1)) throw new RangeError(`share must be 0.1–1, got ${share}`);
  const limitG = carbsTargetG * share;
  return { limitG, maxG: limitG * AMBER_UP_TO };
}

/** Colour of the day's refined-flour grams: limits included in the lower zone. */
export function refinedFlourState(grams: number, { limitG, maxG }: { limitG: number; maxG: number }): Tone {
  if (grams <= limitG) return 'green';
  if (grams <= maxG) return 'yellow';
  return 'red';
}
