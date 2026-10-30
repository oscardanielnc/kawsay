import { waistToHeight } from '@kawsay/core/body/waist-to-height';
import { movementMinutes, movementZone } from '@kawsay/core/energy/movement-minutes';
import { strengthDaysZone } from '@kawsay/core/energy/strength-days';
import { alcoholGrams, alcoholZone } from '@kawsay/core/liver/alcohol-grams';
import { fib4 } from '@kawsay/core/liver/fib4';
import { isSugaryDrink, sugaryDrinksZone } from '@kawsay/core/liver/sugary-drinks';
import { weekSugar } from '@kawsay/core/liver/week-sugar';
import { ageOn } from '@kawsay/core/profile/profile';
import { addDays, type LocalDate } from '@kawsay/core/shared/local-date';
import type { Tone } from '@kawsay/core/shared/tone';
import { daySleepHours } from '@kawsay/core/sleep/sleep-session';
import { weekSleepAverage } from '@kawsay/core/sleep/week-average';
import { listLabs } from '@/features/liver/labs-db';
import { getProfile } from '@/features/profile/profile-db';
import { trendWeightKg } from '@/features/profile/profile-targets';
import { waistsSince } from '@/features/waist/waist-db';
import { weightsBetween } from '@/features/weight/weight-db';
import type { LiverWeek } from '@/features/liver/types';
import type { Db } from '@/lib/db/types';
import { loadDay, summarizeDay, TREND_DAYS } from './day';

const WEEK = 7;
/** Weight change looks back four weeks (F25). */
const WEIGHT_WEEKS = 4;

/**
 * The Liver card (F25, ADR 0020) for the week ending on `end`, from logged data only and offline. Loaded apart from
 * the rest of Insights on purpose: lab results live here and must never reach the AI request (ADR 0019).
 */
export async function loadLiver(db: Db, end: LocalDate): Promise<LiverWeek | null> {
  const profile = await getProfile(db);
  if (!profile?.liverEnabled) return null;
  const from = addDays(end, -(WEEK - 1));
  const weights = await weightsBetween(db, addDays(end, -TREND_DAYS - WEIGHT_WEEKS * 7), end);
  const dates = Array.from({ length: WEEK }, (_, i) => addDays(from, i));
  const days = await Promise.all(dates.map((date) => loadDay(db, date, { profile, weights })));
  const summaries = days.map(summarizeDay);

  const targetKcal =
    summaries.map((s) => s.targets?.targetKcal).find((k): k is number => k !== undefined) ?? 2000;
  const sugar = {
    ...weekSugar(
      summaries.map((s) => s.eaten.addedSugarG),
      targetKcal,
    ),
    dates,
  };

  const drinks = days.flatMap((d) => d.meals.filter((m) => m.volumeMl !== null));
  const sugaryCount = drinks.filter((m) => isSugaryDrink(m.addedSugarG)).length;

  const blocks = days.flatMap((d) => d.activities);
  const moved = movementMinutes(blocks.map((a) => ({ met: a.met, minutes: a.minutes })));
  const strong = days.filter((d) =>
    d.activities.some((a) => a.kind === 'weights' || a.kind === 'routine'),
  ).length;

  const alcoholic = days.flatMap((d) => d.drinks.filter((x) => x.kind === 'alcohol'));
  const grams = alcoholic.reduce(
    (sum, x) => sum + (x.abv === null ? 0 : alcoholGrams(x.volumeMl, x.abv)),
    0,
  );
  const unknown = alcoholic.filter((x) => x.abv === null).length;

  const sleep = weekSleepAverage(
    days.map((d) => (d.sleep.length ? daySleepHours(d.sleep.map((s) => s.stamps)) : null)),
  );

  const waists = await waistsSince(db, addDays(end, -7 * 12));
  const lastWaist = waists.filter((w) => w.weekStart <= end).at(-1);
  const ratio = lastWaist
    ? waistToHeight({ waistCm: lastWaist.cm, heightCm: profile.heightCm })
    : null;

  const trendNow = trendWeightKg(weights.filter((w) => w.date <= end));
  const trendThen = trendWeightKg(weights.filter((w) => w.date <= addDays(end, -WEIGHT_WEEKS * 7)));
  const change = trendNow !== null && trendThen !== null ? trendNow - trendThen : null;
  const losing =
    profile.goalWeightKg !== null && trendNow !== null && profile.goalWeightKg < trendNow;
  const weightZone: Tone | null =
    change === null ? null : !losing || change < 0 ? 'green' : change < 0.5 ? 'yellow' : 'red';

  const [lab] = await listLabs(db);
  const age = ageOn({ ageYears: profile.ageYears, ageSetOn: profile.ageSetOn, today: end });

  const tiles: Omit<LiverWeek, 'from' | 'to' | 'sugar' | 'sugaryDrinks' | 'fib4' | 'inRange'> = {
    movement: { value: moved, zone: movementZone(moved) },
    strengthDays: { value: strong, zone: strengthDaysZone(strong) },
    alcohol: {
      value: alcoholic.length === 0 || unknown < alcoholic.length ? grams : null,
      zone:
        alcoholic.length === 0 || unknown < alcoholic.length
          ? alcoholZone(grams, profile.sex)
          : null,
      unknown,
    },
    sleep: { value: sleep?.hours ?? null, zone: sleep?.zone ?? null },
    waistRatio: { value: ratio?.ratio ?? null, zone: ratio?.tone ?? null },
    weightChange: { value: change, zone: weightZone },
  };
  const inRange =
    (sugar.zone === 'green' ? 1 : 0) +
    Object.values(tiles).filter((tile) => tile.zone === 'green').length;
  return {
    from,
    to: end,
    sugar,
    sugaryDrinks: { count: sugaryCount, zone: sugaryDrinksZone(sugaryCount) },
    ...tiles,
    fib4: lab ? { ...fib4({ ageYears: age, ...lab }), date: lab.date } : null,
    inRange,
  };
}
