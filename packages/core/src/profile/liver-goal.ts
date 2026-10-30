/**
 * Liver-aware goal (F01, ADR 0020; EASL-EASD-EASO 2024): with a BMI of 25 or more, suggest losing 7–10% of the
 * current weight. Rounded to 0.1 kg, as the goal step shows it. null when the BMI is under 25.
 */
export function liverGoalRange(
  weightKg: number,
  bmi: number,
): { fromKg: number; toKg: number } | null {
  if (bmi < 25) return null;
  const tenth = (kg: number) => Math.round(kg * 10) / 10;
  return { fromKg: tenth(weightKg * 0.93), toKg: tenth(weightKg * 0.9) };
}
