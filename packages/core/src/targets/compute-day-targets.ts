import { dayActivityKcal, type ActivityBlock } from '../energy/activity';
import { basalMetabolicRate, type Body } from '../energy/bmr';
import { assertInRange } from '../shared/assert';
import { dayTarget, type DayTarget } from './day-target';
import { dayMacros, type Macros } from './macros';

export interface DayInput {
  /** `weightKg` is the trend weight (F03). */
  body: Body;
  goalKgPerWeek: number;
  /** Night plus naps (F11). */
  sleepHours: number;
  activities: readonly ActivityBlock[];
  /** Logged routine sessions, from `routineSessionEnergy` (F18). */
  routines: readonly { minutes: number; kcal: number }[];
  expenditureFactor?: number;
  proteinGPerKg?: number;
  fatShare?: number;
}

export interface DayTargets extends DayTarget, Macros {
  bmrKcal: number;
  activityKcal: number;
}

/** Everything the Today screen needs, offline: local entries in, targets out (architecture flow 2). */
export function computeDayTargets(input: DayInput): DayTargets {
  const { body, goalKgPerWeek, sleepHours, activities, routines } = input;
  assertInRange('sleepHours', sleepHours, { min: 0, max: 24 });
  const bmrKcal = basalMetabolicRate(body);
  const activityKcal = dayActivityKcal({
    bmrKcal,
    wakingHours: 24 - sleepHours,
    blocks: [
      ...activities,
      ...routines.map((session) => ({ hours: session.minutes / 60, kcal: session.kcal })),
    ],
  });
  const target = dayTarget({
    bmrKcal,
    activityKcal,
    weightKg: body.weightKg,
    goalKgPerWeek,
    expenditureFactor: input.expenditureFactor,
  });
  const macros = dayMacros({
    targetKcal: target.targetKcal,
    weightKg: body.weightKg,
    heightCm: body.heightCm,
    proteinGPerKg: input.proteinGPerKg,
    fatShare: input.fatShare,
  });
  return { bmrKcal, activityKcal, ...target, ...macros };
}
