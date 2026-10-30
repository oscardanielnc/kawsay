import { dayColour, type DayColour } from '@kawsay/core/day/day-colour';
import { addDays, type LocalDate } from '@kawsay/core/shared/local-date';
import { daySleepHours } from '@kawsay/core/sleep/sleep-session';
import type { DayTargets } from '@kawsay/core/targets/compute-day-targets';
import { activitiesOn, type ActivityEntry } from '@/features/activity/activity-db';
import {
  checkInsOn,
  latestCheckIns,
  type CheckIn,
  type LatestCheckIns,
} from '@/features/checkins/checkins-db';
import { drinksOn, type Drink } from '@/features/hydration/hydration-db';
import { dayTotals, mealsOn, type MealEntryView } from '@/features/meals/meals-db';
import { pendingOn, type PendingMeal } from '@/features/meals/pending-db';
import { getProfile, type Profile } from '@/features/profile/profile-db';
import { profileTargets, trendWeightKg } from '@/features/profile/profile-targets';
import { sleepOn, type SleepSession } from '@/features/sleep/sleep-db';
import { dayLogged, type Area } from '@/features/today/day-logged';
import { weightsBetween } from '@/features/weight/weight-db';
import { dayStatusOn, type DayFlags } from '@/lib/db/day-status';
import type { Db } from '@/lib/db/types';

/** Days of weights read for the trend: the EMA forgets older days (0.9^120 < 0.000004). */
export const TREND_DAYS = 120;

type Weight = { date: LocalDate; kg: number };

/** Everything logged on one day, plus the profile and the weights the trend needs. */
export interface DayData {
  date: LocalDate;
  profile: Profile | null;
  /** Weights up to `date`, oldest first. */
  weights: Weight[];
  meals: MealEntryView[];
  /** Meals saved by name, waiting for their food (F23): logged, without nutrients. */
  pending: PendingMeal[];
  activities: ActivityEntry[];
  status: DayFlags;
  checkIns: CheckIn[];
  drinks: Drink[];
  sleep: SleepSession[];
}

export interface DaySummary {
  targets: DayTargets | null;
  eaten: ReturnType<typeof dayTotals>;
  movementMinutes: number;
  checks: LatestCheckIns;
  ring: { areas: Record<Area, boolean>; done: number };
  hasEntries: boolean;
  colour: DayColour;
}

/**
 * Reads one day. The calendar passes `shared` so a month reads the profile and the weights once.
 */
export async function loadDay(
  db: Db,
  date: LocalDate,
  shared?: { profile: Profile | null; weights: readonly Weight[] },
): Promise<DayData> {
  const [profile, weights, meals, pending, activities, status, checkIns, drinks, sleep] =
    await Promise.all([
      shared ? shared.profile : getProfile(db),
      shared
        ? shared.weights.filter((w) => w.date <= date)
        : weightsBetween(db, addDays(date, -TREND_DAYS), date),
      mealsOn(db, date),
      pendingOn(db, date),
      activitiesOn(db, date),
      dayStatusOn(db, date),
      checkInsOn(db, date),
      drinksOn(db, date),
      sleepOn(db, date),
    ]);
  return { date, profile, weights, meals, pending, activities, status, checkIns, drinks, sleep };
}

/** The day's targets (they rise with activity and follow logged sleep), ring and calendar colour. */
export function summarizeDay(day: DayData): DaySummary {
  const weightKg = trendWeightKg(day.weights);
  const blocks = day.activities.map((a) => ({ met: a.met, hours: a.minutes / 60 }));
  const slept = day.sleep.length > 0 ? daySleepHours(day.sleep.map((s) => s.stamps)) : undefined;
  const targets =
    day.profile && weightKg !== null
      ? profileTargets(day.profile, day.date, weightKg, blocks, slept)
      : null;
  const eaten = dayTotals(day.meals);
  const checks = latestCheckIns(day.checkIns);
  const weighed = day.weights.some((w) => w.date === day.date);
  const ring = dayLogged({
    mealSlotsWithEntries: new Set([...day.meals, ...day.pending].map((m) => m.meal)).size,
    activityCount: day.activities.length,
    noActivity: day.status.noActivity,
    weighedToday: weighed,
    urineNoted: checks.urine !== null,
    bathroomNoted: checks.bathroom.length > 0,
    bodyAnswers: [checks.stress, checks.energy, checks.mood].filter(Boolean).length,
    sleepSessions: day.sleep.length,
    sleepRated: day.sleep.filter((s) => s.quality !== null).length,
  });
  const hasEntries =
    day.meals.length +
      day.pending.length +
      day.activities.length +
      day.checkIns.length +
      day.drinks.length +
      day.sleep.length >
      0 ||
    day.status.noActivity ||
    weighed;
  const colour: DayColour = targets
    ? dayColour({
        hasEntries,
        intakeKcal: eaten.kcal,
        targetKcal: targets.targetKcal,
        proteinG: eaten.proteinG,
        targetProteinG: targets.proteinG,
        activityLogged: day.status.noActivity || day.activities.length > 0,
      })
    : 'grey';
  return {
    targets,
    eaten,
    movementMinutes: day.activities.reduce((sum, a) => sum + a.minutes, 0),
    checks,
    ring,
    hasEntries,
    colour,
  };
}
