import { weightAtBmi } from '../body/bmi';
import { assertInRange, assertPositive } from '../shared/assert';

export const KCAL_PER_G = { protein: 4, fat: 9, carbs: 4 } as const;

/** Defaults and user-setting ranges (ADR 0009). */
export const PROTEIN_G_PER_KG = { default: 1.6, min: 1.2, max: 2.2 } as const;
export const FAT_SHARE = { default: 0.25, min: 0.2, max: 0.35 } as const;

/** Below this, the day shows a carbohydrate warning (RDA, ADR 0009). */
export const MIN_CARBS_G = 130;

export interface Macros {
  proteinG: number;
  fatG: number;
  carbsG: number;
  lowCarbs: boolean;
}

/** min(current weight, weight at BMI 25): total weight overestimates protein needs when overweight. */
export function referenceWeightKg({
  weightKg,
  heightCm,
}: {
  weightKg: number;
  heightCm: number;
}): number {
  assertPositive({ weightKg, heightCm });
  return Math.min(weightKg, weightAtBmi(25, heightCm));
}

/** Protein fixed by reference weight, fat as a share of the target, carbohydrates the rest. */
export function dayMacros({
  targetKcal,
  weightKg,
  heightCm,
  proteinGPerKg = PROTEIN_G_PER_KG.default,
  fatShare = FAT_SHARE.default,
}: {
  targetKcal: number;
  weightKg: number;
  heightCm: number;
  proteinGPerKg?: number;
  fatShare?: number;
}): Macros {
  assertPositive({ targetKcal });
  assertInRange('proteinGPerKg', proteinGPerKg, PROTEIN_G_PER_KG);
  assertInRange('fatShare', fatShare, FAT_SHARE);
  const proteinG = proteinGPerKg * referenceWeightKg({ weightKg, heightCm });
  const fatG = (fatShare * targetKcal) / KCAL_PER_G.fat;
  const carbsG =
    (targetKcal - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat) / KCAL_PER_G.carbs;
  return { proteinG, fatG, carbsG, lowCarbs: carbsG < MIN_CARBS_G };
}
