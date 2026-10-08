import type { ActivityBlock } from '@kawsay/core/energy/activity';
import { weightTrend } from '@kawsay/core/body/weight-trend';
import { ageOn, goalKgPerWeek, sleepHours } from '@kawsay/core/profile/profile';
import type { LocalDate } from '@kawsay/core/shared/local-date';
import { computeDayTargets, type DayTargets } from '@kawsay/core/targets/compute-day-targets';
import type { Profile } from './profile-db';

/** The latest trend weight (F03), or null before the first weigh-in. */
export function trendWeightKg(weights: readonly { date: LocalDate; kg: number }[]): number | null {
  return weightTrend(weights).at(-1)?.trendKg ?? null;
}

export function usualSleepHours(profile: Profile): number {
  return sleepHours(
    { start: profile.usualSleepStart, end: profile.usualSleepEnd },
    profile.usualNapStart && profile.usualNapEnd
      ? { start: profile.usualNapStart, end: profile.usualNapEnd }
      : null,
  );
}

/**
 * Targets of a day for the stored profile at the trend weight (ADR 0009). Logged activities and routine sessions
 * (stored as minutes and equivalent MET) raise them; without blocks it is a day without exercise.
 */
export function profileTargets(
  profile: Profile,
  today: LocalDate,
  weightKg: number,
  activities: readonly ActivityBlock[] = [],
  /** Logged sleep of the day (F11); the usual schedule otherwise. */
  sleptHours: number = usualSleepHours(profile),
): DayTargets {
  return computeDayTargets({
    body: {
      sex: profile.sex,
      ageYears: ageOn({ ageYears: profile.ageYears, ageSetOn: profile.ageSetOn, today }),
      heightCm: profile.heightCm,
      weightKg,
    },
    goalKgPerWeek: goalKgPerWeek({
      currentKg: weightKg,
      goalKg: profile.goalWeightKg,
      today,
      goalDate: profile.goalDate,
    }),
    sleepHours: sleptHours,
    activities,
    routines: [],
    expenditureFactor: profile.expenditureFactor,
    proteinGPerKg: profile.proteinGPerKg,
    fatShare: profile.fatShare,
  });
}
