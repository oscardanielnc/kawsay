/** Largest accepted gap between a seed recipe and INS group S (F06). */
export const MAX_GAP = 0.2;

export interface CrossCheck {
  code: string;
  dishKcalPer100g: number;
  referenceKcalPer100g: number;
  strata: number;
  /** dish ÷ reference − 1 */
  gap: number;
  flagged: boolean;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

/** Compares a seed dish with the median of its group S rows; the recipe is never corrected automatically. */
export function crossCheck({
  dishKcalPer100g,
  code,
  rows,
}: {
  dishKcalPer100g: number;
  code: string;
  rows: readonly Record<string, string>[];
}): CrossCheck {
  const kcal = rows
    .filter((row) => row.code === code && row.energy_kcal)
    .map((row) => Number(row.energy_kcal));
  if (kcal.length === 0) throw new Error(`group S has no energy rows for ${code}`);
  const referenceKcalPer100g = median(kcal);
  const gap = dishKcalPer100g / referenceKcalPer100g - 1;
  const roundedGap = Math.round(Math.abs(gap) * 1e6) / 1e6; // 1.2000000000000002 − 1 is 20%
  return {
    code,
    dishKcalPer100g,
    referenceKcalPer100g,
    strata: kcal.length,
    gap,
    flagged: roundedGap > MAX_GAP,
  };
}
