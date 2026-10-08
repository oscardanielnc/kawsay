import type { Sex } from '../energy/bmr';
import { assertAtLeast } from '../shared/assert';

export type Climate = 'warm' | 'temperate' | 'cold';

/** One glass, as tapped in the app (F10). */
export const GLASS_ML = 250;

/** EFSA adequate total water intake per day. */
const EFSA_TOTAL_WATER_ML: Record<Sex, number> = { male: 2500, female: 2000 };

/** Food provides 20–30% of water and is not tracked, so drinks cover 80% (F10). */
const DRINKS_SHARE = 0.8;

const CLIMATE_EXTRA_GLASSES: Record<Climate, number> = { warm: 2, temperate: 0, cold: 0 };
const SWEAT_EXTRA_GLASSES = 2;

/** Glasses to drink today; the base rounds up so it never falls below 80% of the reference. */
export function drinksGoalGlasses({
  sex,
  climate,
  sweatedALot,
}: {
  sex: Sex;
  climate: Climate;
  sweatedALot: boolean;
}): number {
  const base = Math.ceil((EFSA_TOTAL_WATER_ML[sex] * DRINKS_SHARE) / GLASS_ML);
  return base + CLIMATE_EXTRA_GLASSES[climate] + (sweatedALot ? SWEAT_EXTRA_GLASSES : 0);
}

/** Glasses drunk: water, zero-calorie and caloric drinks count; alcohol is shown but not counted (F10). */
export function drunkGlasses(drinks: readonly { ml: number; alcohol: boolean }[]): number {
  return drinks.reduce((sum, { ml, alcohol }) => {
    assertAtLeast(0, { ml });
    return alcohol ? sum : sum + ml / GLASS_ML;
  }, 0);
}
