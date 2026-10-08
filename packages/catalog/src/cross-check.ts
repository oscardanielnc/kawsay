/** Largest accepted gap between a seed recipe and INS group S (F06). */
export const MAX_GAP = 0.2;

/** Below this many establishments in ENCONUT, a group S value describes one kitchen, not a dish. */
export const MIN_ESTABLISHMENTS = 5;

/** What INEI ENCONUT 2013, the survey behind group S, says about the dish; null when it does not list it. */
export interface Survey {
  establishments: number;
  kcalPer100gMin: number;
  kcalPer100gMax: number;
}

export type Verdict = 'within-20' | 'inside-strata-range' | 'outside' | 'weak-reference';

export interface CrossCheck {
  code: string;
  dishKcalPer100g: number;
  referenceKcalPer100g: number;
  strata: number;
  establishments: number | null;
  /** dish ÷ reference − 1 */
  gap: number;
  verdict: Verdict;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

/**
 * Compares a seed dish with the median of its group S strata (F06). A recipe is questioned only when the
 * reference is strong (≥ 5 establishments) and the recipe falls outside both ±20% and the range of the strata.
 * The recipe is never corrected automatically.
 */
export function crossCheck({
  dishKcalPer100g,
  code,
  rows,
  survey,
}: {
  dishKcalPer100g: number;
  code: string;
  rows: readonly Record<string, string>[];
  survey: Survey | null;
}): CrossCheck {
  const kcal = rows
    .filter((row) => row.code === code && row.energy_kcal)
    .map((row) => Number(row.energy_kcal));
  if (kcal.length === 0) throw new Error(`group S has no energy rows for ${code}`);
  const referenceKcalPer100g = median(kcal);
  const gap = dishKcalPer100g / referenceKcalPer100g - 1;
  const roundedGap = Math.round(Math.abs(gap) * 1e6) / 1e6; // 1.2000000000000002 − 1 is 20%

  let verdict: Verdict;
  if (!survey || survey.establishments < MIN_ESTABLISHMENTS) verdict = 'weak-reference';
  else if (roundedGap <= MAX_GAP) verdict = 'within-20';
  else if (dishKcalPer100g >= survey.kcalPer100gMin && dishKcalPer100g <= survey.kcalPer100gMax)
    verdict = 'inside-strata-range';
  else verdict = 'outside';

  return {
    code,
    dishKcalPer100g,
    referenceKcalPer100g,
    strata: kcal.length,
    establishments: survey?.establishments ?? null,
    gap,
    verdict,
  };
}
