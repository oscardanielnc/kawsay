import { assertAtLeast, assertPositive } from '../shared/assert';

/** Energy spent digesting food, applied to the whole day (ADR 0009). */
export const THERMIC_EFFECT_OF_FOOD = 1.1;

/** "Sitting and short walks": the MET of every waking hour without a log (ADR 0009, to be calibrated). */
export const BASELINE_MET = 1.4;

export type Intensity = 'light' | 'medium' | 'hard';

const INTENSITY_FACTOR: Record<Intensity, number> = { light: 0.8, medium: 1, hard: 1.2 };

export interface ActivityBlock {
  met: number;
  hours: number;
}

/** A block whose kcal were already computed, e.g. a routine session (F18). */
export interface ComputedBlock {
  hours: number;
  kcal: number;
}

/** kcal above rest for one block: (MET − 1) × (BMR / 24) × hours × 1.10 (ADR 0009, F08). */
export function activityKcal({ met, hours, bmrKcal }: ActivityBlock & { bmrKcal: number }): number {
  assertPositive({ bmrKcal });
  assertAtLeast(1, { met });
  assertAtLeast(0, { hours });
  return (met - 1) * (bmrKcal / 24) * hours * THERMIC_EFFECT_OF_FOOD;
}

/** For activities with a single Compendium code: light −20%, hard +20% (ADR 0009). */
export function metForIntensity(met: number, intensity: Intensity): number {
  return met * INTENSITY_FACTOR[intensity];
}

/** kcal above rest for the whole day: logged blocks plus the baseline for unlogged waking hours. */
export function dayActivityKcal({
  bmrKcal,
  wakingHours,
  blocks,
}: {
  bmrKcal: number;
  wakingHours: number;
  blocks: readonly (ActivityBlock | ComputedBlock)[];
}): number {
  const loggedHours = blocks.reduce((sum, block) => sum + block.hours, 0);
  const baselineHours = Math.max(0, wakingHours - loggedHours);
  return [...blocks, { met: BASELINE_MET, hours: baselineHours }].reduce(
    (sum, block) => sum + ('kcal' in block ? block.kcal : activityKcal({ ...block, bmrKcal })),
    0,
  );
}
