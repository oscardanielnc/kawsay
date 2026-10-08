import { useCallback, useState } from 'react';
import { addMeal, catalogItems, deleteMeal, mealsOn, recentFor } from '@/features/meals/meals-db';
import { MEALS, MealsSection, type AddMeal } from '@/features/meals/MealsSection';
import { TodayScreen } from '@/features/today/TodayScreen';
import { useDb } from '@/lib/db/DatabaseProvider';
import { deviceTimeZone } from '@/lib/time-zone';
import { today } from '@/lib/today';
import { useLoad } from '@/lib/use-load';

/** Today: the route reads the local database and composes the day's sections (ADR 0003). */
export default function TodayRoute() {
  const { db, env } = useDb();
  const [day] = useState(today);
  const [timeZone] = useState(deviceTimeZone);
  const { data, reload } = useLoad(
    useCallback(async () => {
      const [entries, items, ...recent] = await Promise.all([
        mealsOn(db, day),
        catalogItems(db),
        ...MEALS.map((meal) => recentFor(db, meal)),
      ]);
      const [breakfast = [], lunch = [], dinner = [], snack = []] = recent;
      return { entries, items, recent: { breakfast, lunch, dinner, snack } };
    }, [db, day]),
  );
  const add = async ({ meal, item, servings, grams, saveRestForTomorrow }: AddMeal) => {
    await addMeal(db, env, {
      date: day,
      meal,
      timeZone,
      item: { kind: item.kind, id: item.id },
      ...(servings !== undefined && { servings }),
      ...(grams !== undefined && { grams }),
      saveRestForTomorrow,
    });
    reload();
  };
  const remove = async (id: string) => {
    await deleteMeal(db, env, id);
    reload();
  };
  return (
    <TodayScreen now={new Date()} timeZone={timeZone}>
      {data ? (
        <MealsSection
          entries={data.entries}
          items={data.items}
          recent={data.recent}
          onAdd={(meal) => void add(meal)}
          onDelete={(id) => void remove(id)}
        />
      ) : null}
    </TodayScreen>
  );
}
