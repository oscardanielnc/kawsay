import { THERMIC_EFFECT_OF_FOOD } from '../energy/activity';
import { assertAtLeast, assertPositive } from '../shared/assert';

/** Energy in one kg of body weight lost (ADR 0009). */
export const KCAL_PER_KG = 7700;

/** Fastest safe pace: 1% of body weight per week (ADR 0009, F01). */
export const MAX_WEEKLY_LOSS_SHARE = 0.01;

/** The deficit never takes more than this share of the day's expenditure (ADR 0009). */
export const MAX_DEFICIT_SHARE = 0.25;

export interface DayTarget {
  expenditureKcal: number;
  deficitKcal: number;
  targetKcal: number;
}

/**
 * Day target = expenditure − deficit, never below BMR (ADR 0009).
 * `activityKcal` comes from `dayActivityKcal`, which already includes the thermic effect of food.
 * A goal that is not a loss (`goalKgPerWeek >= 0`) means no deficit.
 */
export function dayTarget({
  bmrKcal,
  activityKcal,
  weightKg,
  goalKgPerWeek,
}: {
  bmrKcal: number;
  activityKcal: number;
  weightKg: number;
  goalKgPerWeek: number;
}): DayTarget {
  assertPositive({ bmrKcal, weightKg });
  assertAtLeast(0, { activityKcal });
  const expenditureKcal = bmrKcal * THERMIC_EFFECT_OF_FOOD + activityKcal;
  const deficitKcal = Math.min(
    (Math.max(0, -goalKgPerWeek) * KCAL_PER_KG) / 7,
    (MAX_WEEKLY_LOSS_SHARE * weightKg * KCAL_PER_KG) / 7,
    MAX_DEFICIT_SHARE * expenditureKcal,
  );
  return {
    expenditureKcal,
    deficitKcal,
    targetKcal: Math.max(expenditureKcal - deficitKcal, bmrKcal),
  };
}

/** Ceil that ignores floating-point noise: 10.000000000000002 weeks is 10 weeks. */
function ceilWeeks(weeks: number): number {
  return Math.ceil(Math.round(weeks * 1e6) / 1e6);
}

/** Pace the goal asks for; above 1% of body weight per week, the weeks a safe pace needs (F01). */
export function goalPace({
  currentKg,
  goalKg,
  weeks,
}: {
  currentKg: number;
  goalKg: number;
  weeks: number;
}): { kgPerWeek: number; tooFast: boolean; suggestedWeeks: number | null } {
  assertPositive({ currentKg, goalKg, weeks });
  const kgPerWeek = (goalKg - currentKg) / weeks;
  const safeKgPerWeek = MAX_WEEKLY_LOSS_SHARE * currentKg;
  const tooFast = Math.abs(kgPerWeek) > safeKgPerWeek;
  return {
    kgPerWeek,
    tooFast,
    suggestedWeeks: tooFast ? ceilWeeks(Math.abs(goalKg - currentKg) / safeKgPerWeek) : null,
  };
}
