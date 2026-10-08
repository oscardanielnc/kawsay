import { activityKcal } from '@kawsay/core/energy/activity';
import type { ActivityKind } from '@kawsay/core/energy/activity-types';
import { addDays, type LocalDate } from '@kawsay/core/shared/local-date';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import {
  activitiesOn,
  addActivity,
  bandAt,
  dayStatusOn,
  deleteActivity,
  setNoActivity,
} from '@/features/activity/activity-db';
import { ActivitySection, type ActivityView } from '@/features/activity/ActivitySection';
import type { NewActivityChoice } from '@/features/activity/AddActivity';
import {
  addMeal,
  catalogItems,
  dayTotals,
  deleteMeal,
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
import { dayLogged } from '@/features/today/day-logged';
import { DayRings } from '@/features/today/DayRings';
import { RangeRows } from '@/features/today/RangeRows';
import { TodayScreen } from '@/features/today/TodayScreen';
import { weightsBetween } from '@/features/weight/weight-db';
import { Card } from '@/components/layout/Card';
import { useDb } from '@/lib/db/DatabaseProvider';
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
      const [profile, weights, entries, items, activities, status, routines, ...recent] =
        await Promise.all([
          getProfile(db),
          weightsBetween(db, addDays(day, -TREND_DAYS), day),
          mealsOn(db, day),
          catalogItems(db),
          activitiesOn(db, day),
          dayStatusOn(db, day),
          listRoutines(db),
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
        recent: { breakfast, lunch, dinner, snack },
      };
    }, [db, day]),
  );

  const isToday = day === today();
  const defaultBand = bandAt(hourIn(timeZone));
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

  if (!data) return <TodayScreen now={new Date()} timeZone={timeZone} day={day} onDay={setDay} />;

  const weightKg = trendWeightKg(data.weights);
  const blocks = data.activities.map((a) => ({ met: a.met, hours: a.minutes / 60 }));
  const targets =
    data.profile && weightKg !== null ? profileTargets(data.profile, day, weightKg, blocks) : null;
  const eaten = dayTotals(data.entries);
  const movementMinutes = data.activities.reduce((sum, a) => sum + a.minutes, 0);
  const logged = dayLogged({
    mealSlotsWithEntries: new Set(data.entries.map((e) => e.meal)).size,
    activityCount: data.activities.length,
    noActivity: data.status.noActivity,
    weighedToday: data.weights.some((w) => w.date === day),
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
    </TodayScreen>
  );
}
