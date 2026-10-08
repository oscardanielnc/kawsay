import { drinksGoalGlasses, GLASS_ML } from '@kawsay/core/day/drinks';
import { activityKcal } from '@kawsay/core/energy/activity';
import type { ActivityKind } from '@kawsay/core/energy/activity-types';
import { addDays, type LocalDate } from '@kawsay/core/shared/local-date';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import {
  addActivity,
  bandAt,
  deleteActivity,
  setNoActivity,
} from '@/features/activity/activity-db';
import { ActivitySection, type ActivityView } from '@/features/activity/ActivitySection';
import type { NewActivityChoice } from '@/features/activity/AddActivity';
import { addCheckIn, deleteCheckIn } from '@/features/checkins/checkins-db';
import { CheckInsSection } from '@/features/checkins/CheckInsSection';
import { addDrink, deleteDrink, setSweatedALot } from '@/features/hydration/hydration-db';
import { HydrationSection, type CaloricDrink } from '@/features/hydration/HydrationSection';
import { addMeal, catalogItems, deleteMeal, mealAt, recentFor } from '@/features/meals/meals-db';
import { MEALS, MealsSection, type AddMeal } from '@/features/meals/MealsSection';
import {
  deleteRoutine,
  listRoutines,
  saveRoutine,
  type RoutineInput,
} from '@/features/routines/routines-db';
import { RoutinesBlock, type LoggedSession } from '@/features/routines/RoutinesBlock';
import { deleteSleep, saveSleep } from '@/features/sleep/sleep-db';
import { SleepSection, type SleepChange } from '@/features/sleep/SleepSection';
import { DayRings } from '@/features/today/DayRings';
import { RangeRows } from '@/features/today/RangeRows';
import { TodayScreen } from '@/features/today/TodayScreen';
import { saveWaist, waistsSince } from '@/features/waist/waist-db';
import { WaistCard } from '@/features/waist/WaistCard';
import { WeightCard } from '@/features/weight/WeightCard';
import { saveWeight } from '@/features/weight/weight-db';
import { Card } from '@/components/layout/Card';
import { loadDay, summarizeDay } from '@/compose/day';
import { useDb } from '@/lib/db/DatabaseProvider';
import { deviceTimeZone } from '@/lib/time-zone';
import { today } from '@/lib/today';
import { useLoad } from '@/lib/use-load';
import { useReloadOnFocus } from '@/lib/use-reload-on-focus';
import { color, type } from '@/lib/theme';

function hourIn(timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(
      new Date(),
    ),
  );
}

/** Today: the route reads the day (compose/day, ADR 0017) and lays out each feature's section (ADR 0003). */
export default function TodayRoute() {
  const { t } = useTranslation();
  const { db, env } = useDb();
  const [timeZone] = useState(deviceTimeZone);
  // The shown day lives in the URL, so the calendar can open any day ("Open this day", F14).
  const params = useLocalSearchParams<{ day?: string }>();
  const day: LocalDate =
    params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) ? params.day : today();
  const setDay = (next: LocalDate) => router.setParams({ day: next });
  const { data, reload } = useLoad(
    useCallback(async () => {
      const [dayData, items, routines, waists, ...recent] = await Promise.all([
        loadDay(db, day),
        catalogItems(db),
        listRoutines(db),
        waistsSince(db, addDays(day, -7 * 12)),
        ...MEALS.map((meal) => recentFor(db, meal)),
      ]);
      const [breakfast = [], lunch = [], dinner = [], snack = []] = recent;
      return {
        ...dayData,
        entries: dayData.meals,
        items,
        routines,
        waists,
        recent: { breakfast, lunch, dinner, snack },
      };
    }, [db, day]),
  );

  useReloadOnFocus(reload);
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

  const { targets, eaten, movementMinutes, checks, ring: logged } = summarizeDay(data);
  const fromMeals = data.entries.flatMap((e) =>
    e.volumeMl === null
      ? []
      : [{ name: e.name, from: t(`meals.slots.${e.meal}`).toLowerCase(), volumeMl: e.volumeMl }],
  );
  const caloricDrinks: CaloricDrink[] = data.items
    .filter((i) => i.isDrink && (i.kcalPerServing ?? 0) > 0)
    .map((i) => ({ kind: i.kind, id: i.id, name: i.name }));
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
      {data.profile?.waistEnabled ? (
        <WaistCard
          day={day}
          waists={data.waists.filter((w) => w.weekStart <= day)}
          heightCm={data.profile.heightCm}
          reminderDay={data.profile.waistReminderDay}
          onSave={(cm) => run(() => saveWaist(db, env, { date: day, cm, timeZone }))}
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
