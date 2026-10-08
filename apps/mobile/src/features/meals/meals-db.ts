import { recipeTotals } from '@kawsay/core/food/recipe-totals';
import { addDays, type LocalDate } from '@kawsay/core/shared/local-date';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { dish, food, foodUnit, mealEntry, userDish, userDishItem } from '@/lib/db/schema';
import { inTransaction } from '@/lib/db/transaction';
import type { Db, RecordEnv } from '@/lib/db/types';
import type { Searchable } from './search';

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type Nutrients = Record<string, number | null> | null;

/** A dish or food as the add sheet shows it. */
export interface CatalogItem extends Searchable {
  icon: string;
  group: string;
  /** Grams in one serving: the dish serving, or the food's first household unit. */
  servingGrams: number | null;
  kcalPerServing: number | null;
  isDrink: boolean;
  per100g: Nutrients;
}

export interface MealEntryView {
  id: string;
  meal: Meal;
  kind: 'dish' | 'food';
  itemId: string;
  name: string;
  icon: string;
  servings: number | null;
  grams: number | null;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  volumeMl: number | null;
  leftoverOf: string | null;
}

/** The meal a drink tapped in hydration goes to, by the local hour (F10). */
export function mealAt(hour: number): Meal {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 19) return 'snack';
  return 'dinner';
}

/** Dish groups suggested first for each meal when the user has no history yet. */
const GROUPS_FOR: Record<Meal, string[]> = {
  breakfast: ['breakfast', 'drink'],
  lunch: ['main', 'soup', 'salad', 'side'],
  dinner: ['main', 'soup', 'salad', 'side'],
  snack: ['sweet', 'drink', 'breakfast'],
};
const RECENT = 12;

/** Every dish and food, dishes first (the user's own before the seed), for the add sheet and search (F05–F07). */
export async function catalogItems(db: Db): Promise<CatalogItem[]> {
  const [dishes, foods, units, ownDishes, ownItems] = await Promise.all([
    db.select().from(dish),
    db.select().from(food),
    db.select().from(foodUnit).orderBy(asc(foodUnit.position)),
    db.select().from(userDish).where(isNull(userDish.deletedAt)).orderBy(asc(userDish.name)),
    db
      .select()
      .from(userDishItem)
      .where(isNull(userDishItem.deletedAt))
      .orderBy(asc(userDishItem.position)),
  ]);
  const firstUnit = new Map<string, { label: string; grams: number | null }>();
  for (const unit of units) if (!firstUnit.has(unit.foodId)) firstUnit.set(unit.foodId, unit);
  const foodById = new Map(foods.map((f) => [f.id, f]));
  return [
    ...ownDishes.flatMap((d) => {
      const items = ownItems
        .filter((i) => i.userDishId === d.id)
        .map((i) => ({ per100g: foodById.get(i.foodId)?.per100g ?? null, grams: i.grams }));
      if (items.length === 0) return [];
      const keys = [...new Set(items.flatMap((i) => Object.keys(i.per100g ?? {})))];
      const totals = recipeTotals(items, d.servings, keys);
      return [
        {
          kind: 'dish' as const,
          id: d.id,
          name: d.name,
          source: 'user',
          icon: d.icon,
          group: 'user',
          servingGrams: totals.servingGrams,
          kcalPerServing: totals.perServing.energyKcal ?? null,
          isDrink: d.icon === 'jugo',
          per100g: totals.per100g,
        },
      ];
    }),
    ...dishes.map((d) => ({
      kind: 'dish' as const,
      id: d.id,
      name: d.name,
      source: 'dish',
      icon: d.icon,
      group: d.group,
      servingGrams: d.servingGrams,
      kcalPerServing: d.perServing?.energyKcal ?? null,
      isDrink: d.group === 'drink',
      per100g: d.per100g,
    })),
    ...foods.map((f) => {
      const unit = firstUnit.get(f.id);
      const grams = unit?.grams ?? null;
      const kcal100 = f.per100g?.energyKcal;
      const isDrink = /\bvaso\b/i.test(unit?.label ?? '');
      return {
        kind: 'food' as const,
        id: f.id,
        name: f.name,
        source: f.sourceKind,
        icon: isDrink ? 'jugo' : 'plato',
        group: 'food',
        servingGrams: grams,
        kcalPerServing: grams !== null && kcal100 != null ? (kcal100 * grams) / 100 : null,
        isDrink,
        per100g: f.per100g,
      };
    }),
  ];
}

/** Household units of every food with a known weight, for the ingredient amounts of a new dish (F07). */
export async function foodUnits(
  db: Db,
): Promise<Record<string, { label: string; grams: number }[]>> {
  const rows = await db.select().from(foodUnit).orderBy(asc(foodUnit.position));
  const units: Record<string, { label: string; grams: number }[]> = {};
  for (const { foodId, label, grams } of rows) {
    if (grams !== null) (units[foodId] ??= []).push({ label, grams });
  }
  return units;
}

export interface NewDish {
  name: string;
  icon: string;
  servings: number;
  items: { foodId: string; grams: number; unitLabel: string | null; unitCount: number | null }[];
}

/** Saves a dish built from catalog foods (F07). */
export async function saveUserDish(
  db: Db,
  env: RecordEnv,
  input: NewDish,
): Promise<{ id: string }> {
  const name = input.name.trim();
  if (!name || input.items.length === 0)
    throw new Error('a dish needs a name and at least one ingredient');
  return inTransaction(db, async () => {
    const record = newRecord(env);
    await db
      .insert(userDish)
      .values({ ...record, name, icon: input.icon, servings: input.servings });
    for (const [position, item] of input.items.entries()) {
      await db
        .insert(userDishItem)
        .values({ ...newRecord(env), userDishId: record.id, position, ...item });
    }
    return { id: record.id };
  });
}

const keyOf = (kind: string, id: string) => `${kind}:${id}`;

/** Grams eaten: given directly, or portions × the serving weight. */
function gramsEaten(
  item: CatalogItem,
  servings: number | null,
  grams: number | null,
): number | null {
  if (grams !== null) return grams;
  return servings !== null && item.servingGrams !== null ? servings * item.servingGrams : null;
}

export async function addMeal(
  db: Db,
  env: RecordEnv,
  input: {
    date: LocalDate;
    meal: Meal;
    timeZone: string;
    item: { kind: 'dish' | 'food'; id: string };
    servings?: number;
    grams?: number;
    /** Below one serving: pre-add the remainder to tomorrow's breakfast (F05). */
    saveRestForTomorrow?: boolean;
  },
): Promise<{ id: string }> {
  const items = await catalogItems(db);
  const item = items.find((i) => i.kind === input.item.kind && i.id === input.item.id);
  if (!item) throw new Error(`${input.item.kind} ${input.item.id} is not in the catalog`);
  const servings = input.servings ?? null;
  const grams = input.grams ?? null;
  const entry = (
    record: { id: string; updatedAt: number },
    date: LocalDate,
    meal: Meal,
    s: number | null,
    g: number | null,
    leftoverOf: string | null,
  ) => ({
    ...record,
    date,
    meal,
    loggedAt: record.updatedAt,
    timeZone: input.timeZone,
    dishId: item.kind === 'dish' ? item.id : null,
    foodId: item.kind === 'food' ? item.id : null,
    servings: s,
    grams: g,
    volumeMl: item.isDrink ? gramsEaten(item, s, g) : null,
    leftoverOf,
  });

  return inTransaction(db, async () => {
    const record = newRecord(env);
    await db.insert(mealEntry).values(entry(record, input.date, input.meal, servings, grams, null));
    const eatenShare =
      servings ?? (grams !== null && item.servingGrams ? grams / item.servingGrams : 1);
    if (input.saveRestForTomorrow && eatenShare < 1) {
      const rest = Math.round((1 - eatenShare) * 100) / 100;
      await db
        .insert(mealEntry)
        .values(entry(newRecord(env), addDays(input.date, 1), 'breakfast', rest, null, record.id));
    }
    return { id: record.id };
  });
}

/** The day's live entries with their nutrients, in the order they were logged. */
export async function mealsOn(db: Db, date: LocalDate): Promise<MealEntryView[]> {
  const [rows, items] = await Promise.all([
    db
      .select()
      .from(mealEntry)
      .where(and(eq(mealEntry.date, date), isNull(mealEntry.deletedAt)))
      .orderBy(asc(mealEntry.loggedAt)),
    catalogItems(db),
  ]);
  const byKey = new Map(items.map((i) => [keyOf(i.kind, i.id), i]));
  return rows.flatMap((row) => {
    const kind = row.dishId ? 'dish' : 'food';
    const item = byKey.get(keyOf(kind, row.dishId ?? row.foodId ?? ''));
    if (!item) return [];
    const grams = gramsEaten(item, row.servings, row.grams);
    const of = (key: string) => ((item.per100g?.[key] ?? 0) * (grams ?? 0)) / 100;
    return [
      {
        id: row.id,
        meal: row.meal,
        kind,
        itemId: item.id,
        name: item.name,
        icon: item.icon,
        servings: row.servings,
        grams,
        kcal: of('energyKcal'),
        proteinG: of('proteinG'),
        fatG: of('fatG'),
        carbsG: of('carbsTotalG'),
        volumeMl: row.volumeMl,
        leftoverOf: row.leftoverOf,
      },
    ];
  });
}

export function dayTotals(entries: readonly MealEntryView[]) {
  return entries.reduce(
    (sum, e) => ({
      kcal: sum.kcal + e.kcal,
      proteinG: sum.proteinG + e.proteinG,
      fatG: sum.fatG + e.fatG,
      carbsG: sum.carbsG + e.carbsG,
    }),
    { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0 },
  );
}

export async function deleteMeal(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await db.update(mealEntry).set({ deletedAt: now, updatedAt: now }).where(eq(mealEntry.id, id));
}

/** Most recently logged dishes and foods first, then dishes suited to this meal, up to 12 (F05). */
export async function recentFor(db: Db, meal: Meal): Promise<CatalogItem[]> {
  const [rows, items] = await Promise.all([
    db
      .select({ dishId: mealEntry.dishId, foodId: mealEntry.foodId })
      .from(mealEntry)
      .where(isNull(mealEntry.deletedAt))
      .orderBy(desc(mealEntry.loggedAt))
      .limit(200),
    catalogItems(db),
  ]);
  const byKey = new Map(items.map((i) => [keyOf(i.kind, i.id), i]));
  const picked = new Map<string, CatalogItem>();
  for (const row of rows) {
    const key = row.dishId ? keyOf('dish', row.dishId) : keyOf('food', row.foodId ?? '');
    const item = byKey.get(key);
    if (item && !picked.has(key)) picked.set(key, item);
  }
  const groups = GROUPS_FOR[meal];
  const suggestions = items
    .filter((i) => i.kind === 'dish')
    .sort((a, b) => rank(groups, a.group) - rank(groups, b.group));
  for (const item of suggestions) {
    if (picked.size >= RECENT) break;
    picked.set(keyOf(item.kind, item.id), item);
  }
  return [...picked.values()].slice(0, RECENT);
}

function rank(groups: string[], group: string): number {
  const index = groups.indexOf(group);
  return index === -1 ? groups.length : index;
}

/** Caloric drinks logged in meals, for the hydration view (F10): one entry, two views. */
export async function drinksFromMeals(
  db: Db,
  date: LocalDate,
): Promise<{ name: string; meal: Meal; volumeMl: number }[]> {
  return (await mealsOn(db, date)).flatMap((e) =>
    e.volumeMl === null ? [] : [{ name: e.name, meal: e.meal, volumeMl: e.volumeMl }],
  );
}
