import { assertAtLeast } from '../shared/assert';

/** Nutrients of the weekly view (F19), named like the catalog's per-100 g keys. */
export const WEEKLY_NUTRIENTS = [
  'fiberG',
  'ironMg',
  'zincMg',
  'calciumMg',
  'potassiumMg',
  'vitaminARaeUg',
  'vitaminCMg',
  'thiaminMg',
  'riboflavinMg',
  'niacinMg',
  'folateUg',
  'vitaminB12Ug',
  'sodiumMg',
] as const;
export type WeeklyNutrient = (typeof WEEKLY_NUTRIENTS)[number];

/** Sodium is a ceiling (WHO), every other one a daily amount to reach. */
export const SODIUM_LIMIT_MG = 2000;
/** Fibre: 14 g per 1,000 kcal of the day's target (NAM AI). */
export const FIBRE_G_PER_1000_KCAL = 14;

type Sex = 'male' | 'female';
type Amounts = Record<Exclude<WeeklyNutrient, 'fiberG' | 'sodiumMg'>, number>;

/** NAM dietary reference intakes for adults 19–50 (RDA, or AI for potassium; 2019 for potassium). */
const ADULT: Record<Sex, Amounts> = {
  male: {
    ironMg: 8,
    zincMg: 11,
    calciumMg: 1000,
    potassiumMg: 3400,
    vitaminARaeUg: 900,
    vitaminCMg: 90,
    thiaminMg: 1.2,
    riboflavinMg: 1.3,
    niacinMg: 16,
    folateUg: 400,
    vitaminB12Ug: 2.4,
  },
  female: {
    ironMg: 18,
    zincMg: 8,
    calciumMg: 1000,
    potassiumMg: 2600,
    vitaminARaeUg: 700,
    vitaminCMg: 75,
    thiaminMg: 1.1,
    riboflavinMg: 1.1,
    niacinMg: 14,
    folateUg: 400,
    vitaminB12Ug: 2.4,
  },
};

/**
 * Daily references of an adult (F19). From 51 on, women need 8 mg of iron and 1,200 mg of calcium; men 1,200 mg of
 * calcium from 71. Under 19 uses the adult values (the app is for adults; pregnancy and lactation not supported).
 */
export function dailyReferences({
  sex,
  ageYears,
  targetKcal,
}: {
  sex: Sex;
  ageYears: number;
  targetKcal: number;
}): Record<WeeklyNutrient, number> {
  assertAtLeast(0, { ageYears, targetKcal });
  const base = { ...ADULT[sex] };
  if (sex === 'female' && ageYears >= 51) Object.assign(base, { ironMg: 8, calciumMg: 1200 });
  if (sex === 'male' && ageYears >= 71) base.calciumMg = 1200;
  return {
    ...base,
    fiberG: (FIBRE_G_PER_1000_KCAL * targetKcal) / 1000,
    sodiumMg: SODIUM_LIMIT_MG,
  };
}
