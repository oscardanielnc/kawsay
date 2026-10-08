import { drinksGoalGlasses, GLASS_ML } from '@kawsay/core/day/drinks';
import { activityKcal } from '@kawsay/core/energy/activity';
import type { ActivityKind } from '@kawsay/core/energy/activity-types';
import { addDays, type LocalDate } from '@kawsay/core/shared/local-date';
import { daySleepHours } from '@kawsay/core/sleep/sleep-session';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import {
  activitiesOn,
  addActivity,
  bandAt,
  deleteActivity,
  setNoActivity,
} from '@/features/activity/activity-db';
import { ActivitySection, type ActivityView } from '@/features/activity/ActivitySection';
import type { NewActivityChoice } from '@/features/activity/AddActivity';
import {
  addCheckIn,
  checkInsOn,
  deleteCheckIn,
  latestCheckIns,
} from '@/features/checkins/checkins-db';
import { CheckInsSection } from '@/features/checkins/CheckInsSection';
import { addDrink, deleteDrink, drinksOn, setSweatedALot } from '@/features/hydration/hydration-db';
import { HydrationSection, type CaloricDrink } from '@/features/hydration/HydrationSection';
import {
  addMeal,
  catalogItems,
  dayTotals,
  deleteMeal,
  mealAt,
  mealsOn,
  recentFor,
} from '@/features/meals/meals-db';
import { MEALS, MealsSection, type AddMeal } from '@/features/meals/MealsSection';
import { getProfile } from '@/features/profile/profile-db';
import { profileTargets, trendWeightKg } from '@/features/profile/profile-targets';
import {
  deleteRoutine,
  listRoutines,
  saveRoutine,
  type RoutineInput,
} from '@/features/routines/routines-db';
import { RoutinesBlock, type LoggedSession } from '@/features/routines/RoutinesBlock';
import { deleteSleep, saveSleep, sleepOn } from '@/features/sleep/sleep-db';
import { SleepSection, type SleepChange } from '@/features/sleep/SleepSection';
import { dayLogged } from '@/features/today/day-logged';
import { DayRings } from '@/features/today/DayRings';
import { RangeRows } from '@/features/today/RangeRows';
import { TodayScreen } from '@/features/today/TodayScreen';
import { WeightCard } from '@/features/weight/WeightCard';
import { saveWeight, weightsBetween } from '@/features/weight/weight-db';
import { Card } from '@/components/layout/Card';
import { useDb } from '@/lib/db/DatabaseProvider';
import { dayStatusOn } from '@/lib/db/day-status';
import { deviceTimeZone } from '@/lib/time-zone';
import { today } from '@/lib/today';
import { useLoad } from '@/lib/use-load';
import { color, type } from '@/lib/theme';

/** Days of weights read for the trend: the EMA forgets older days (0.9^120 < 0.000004). */
const TREND_DAYS = 120;

function hourIn(timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(
      new Date(),
    ),
  );
}

/** Today: the route reads the local database and composes the day's sections (ADR 0003). */
export default function TodayRoute() {
  const { t } = useTranslation();
  const { db, env } = useDb();
  const [timeZone] = useState(deviceTimeZone);
  const [day, setDay] = useState<LocalDate>(today);
  const { data, reload } = useLoad(
    useCallback(async () => {
      const [
        profile,
        weights,
        entries,
        items,
        activities,
        status,
        routines,
        checkIns,
        drinks,
        sleep,
        ...recent
      ] = await Promise.all([
        getProfile(db),
        weightsBetween(db, addDays(day, -TREND_DAYS), day),
        mealsOn(db, day),
        catalogItems(db),
        activitiesOn(db, day),
        dayStatusOn(db, day),
        listRoutines(db),
        checkInsOn(db, day),
        drinksOn(db, day),
        sleepOn(db, day),
        ...MEALS.map((meal) => recentFor(db, meal)),
      ]);
      const [breakfast = [], lunch = [], dinner = [], snack = []] = recent;
      return {
        profile,
        weights,
        entries,
        items,
        activities,
        status,
        routines,
        checkIns,
        drinks,
        sleep,
        recent: { breakfast, lunch, dinner, snack },
      };
    }, [db, day]),
  );

  const isToday = day === today();
  const hour = hourIn(timeZone);
  const defaultBand = bandAt(hour);
  const run = (write: () => Promise<unknown>) => void write().then(reload);

  const addMealEntry = ({ meal, item, servings, grams, saveRestForTomorrow }: AddMeal) =>
    run(() =>
      addMeal(db, env, {
        date: day,
        meal,
        timeZone,
        item: { kind: item.kind, id: item.id },
        ...(servings !== undefined && { servings }),
        ...(grams !== undefined && { grams }),
        saveRestForTomorrow,
      }),
    );
  const addActivityEntry = ({ kind, intensity, minutes, met, timeBand }: NewActivityChoice) =>
    run(() =>
      addActivity(db, env, { date: day, timeZone, kind, intensity, minutes, met, timeBand }),
    );
  const logRoutine = ({ routine, minutes, met, timeBand }: LoggedSession) =>
    run(() =>
      addActivity(db, env, {
        date: day,
        timeZone,
        kind: 'routine',
        intensity: null,
        minutes,
        met,
        timeBand,
        routineId: routine.id,
      }),
    );

  const addCaloricDrink = (drink: CaloricDrink) =>
    run(() =>
      addMeal(db, env, {
        date: day,
        meal: mealAt(hour),
        timeZone,
        item: { kind: drink.kind, id: drink.id },
        servings: 1,
      }),
    );
  const saveSleepChange = (change: SleepChange) =>
    run(() => saveSleep(db, env, { ...change, date: day, timeZone }));

  if (!data) return <TodayScreen now={new Date()} timeZone={timeZone} day={day} onDay={setDay} />;

  const weightKg = trendWeightKg(data.weights);
  const blocks = data.activities.map((a) => ({ met: a.met, hours: a.minutes / 60 }));
  const slept = data.sleep.length > 0 ? daySleepHours(data.sleep.map((s) => s.stamps)) : undefined;
  const targets =
    data.profile && weightKg !== null
      ? profileTargets(data.profile, day, weightKg, blocks, slept)
      : null;
  const checks = latestCheckIns(data.checkIns);
  const fromMeals = data.entries.flatMap((e) =>
    e.volumeMl === null
      ? []
      : [{ name: e.name, from: t(`meals.slots.${e.meal}`).toLowerCase(), volumeMl: e.volumeMl }],
  );
  const caloricDrinks: CaloricDrink[] = data.items
    .filter((i) => i.isDrink && (i.kcalPerServing ?? 0) > 0)
    .map((i) => ({ kind: i.kind, id: i.id, name: i.name }));
  const eaten = dayTotals(data.entries);
  const movementMinutes = data.activities.reduce((sum, a) => sum + a.minutes, 0);
  const logged = dayLogged({
    mealSlotsWithEntries: new Set(data.entries.map((e) => e.meal)).size,
    activityCount: data.activities.length,
    noActivity: data.status.noActivity,
    weighedToday: data.weights.some((w) => w.date === day),
    drinkCount: data.drinks.length + fromMeals.length,
    urineNoted: checks.urine !== null,
    bathroomNoted: checks.bathroom.length > 0,
    bodyAnswers: [checks.bloating, checks.stress, checks.energy, checks.mood].filter(Boolean)
      .length,
    sleepSessions: data.sleep.length,
    sleepRated: data.sleep.filter((s) => s.quality !== null).length,
  });
  const routineName = new Map(data.routines.map((r) => [r.id, r.name]));
  const activityViews: ActivityView[] = targets
    ? data.activities.map((a) => ({
        id: a.id,
        name:
          a.kind === 'routine'
            ? (routineName.get(a.routineId ?? '') ?? t('activity.kinds.routine'))
            : t(`activity.kinds.${a.kind as ActivityKind}`),
        icon: a.kind === 'routine' ? 'weights' : a.kind,
        minutes: a.minutes,
        intensity: a.intensity,
        timeBand: a.timeBand,
        kcal: activityKcal({ met: a.met, hours: a.minutes / 60, bmrKcal: targets.bmrKcal }),
      }))
    : [];

  return (
    <TodayScreen now={new Date()} timeZone={timeZone} day={day} onDay={setDay}>
      <DayRings
        areas={logged.areas}
        done={logged.done}
        movementMinutes={movementMinutes}
        movementGoalMin={data.profile?.movementGoalMin ?? 30}
      />
      {targets ? (
        <Card title={t('ranges.title')}>
          <RangeRows targets={targets} eaten={eaten} dayOpen={isToday} />
        </Card>
      ) : (
        <Text style={[type.body, { color: color.inkMuted }]}>{t('today.needWeight')}</Text>
      )}
      <MealsSection
        entries={data.entries}
        items={data.items}
        recent={data.recent}
        onAdd={addMealEntry}
        onDelete={(id) => run(() => deleteMeal(db, env, id))}
      />
      {targets ? (
        <ActivitySection
          entries={activityViews}
          noActivity={data.status.noActivity}
          bmrKcal={targets.bmrKcal}
          defaultBand={defaultBand}
          onAdd={addActivityEntry}
          onDelete={(id) => run(() => deleteActivity(db, env, id))}
          onNoActivity={(on) => run(() => setNoActivity(db, env, day, on))}
        >
          <RoutinesBlock
            routines={data.routines}
            bmrKcal={targets.bmrKcal}
            defaultBand={defaultBand}
            onLog={logRoutine}
            onSave={(routine: RoutineInput) => run(() => saveRoutine(db, env, routine))}
            onDelete={(id) => run(() => deleteRoutine(db, env, id))}
          />
        </ActivitySection>
      ) : null}
      {data.profile ? (
        <HydrationSection
          drinks={data.drinks}
          fromMeals={fromMeals}
          goalGlasses={drinksGoalGlasses({
            sex: data.profile.sex,
            climate: data.profile.climate,
            sweatedALot: data.status.sweatedALot,
          })}
          sweated={data.status.sweatedALot}
          urine={checks.urine}
          caloricDrinks={caloricDrinks}
          onAdd={(kind) =>
            run(() => addDrink(db, env, { date: day, timeZone, kind, volumeMl: GLASS_ML }))
          }
          onDelete={(id) => run(() => deleteDrink(db, env, id))}
          onAddCaloric={addCaloricDrink}
          onUrine={(value) =>
            run(() => addCheckIn(db, env, { date: day, timeZone, kind: 'urine', value }))
          }
          onSweated={(on) => run(() => setSweatedALot(db, env, day, on))}
        />
      ) : null}
      <CheckInsSection
        rows={data.checkIns}
        onCheckIn={(kind, value) =>
          run(() => addCheckIn(db, env, { date: day, timeZone, kind, value }))
        }
        onDelete={(id) => run(() => deleteCheckIn(db, env, id))}
      />
      {data.profile ? (
        <SleepSection
          sessions={data.sleep}
          usualNight={{ start: data.profile.usualSleepStart, end: data.profile.usualSleepEnd }}
          usualNap={
            data.profile.usualNapStart && data.profile.usualNapEnd
              ? { start: data.profile.usualNapStart, end: data.profile.usualNapEnd }
              : null
          }
          onSave={saveSleepChange}
          onDelete={(id) => run(() => deleteSleep(db, env, id))}
        />
      ) : null}
      <WeightCard
        day={day}
        weights={data.weights}
        onSave={(kg) => run(() => saveWeight(db, env, { date: day, kg, timeZone }))}
      />
    </TodayScreen>
  );
}
