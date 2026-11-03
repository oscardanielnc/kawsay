import { recipeTotals } from '@kawsay/core/food/recipe-totals';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { dish, dishItem, food, foodUnit, userDish, userDishItem } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';

/** Nutrients the detail shows, in this order (F06). */
export const DETAIL_NUTRIENTS = [
  'energyKcal',
  'proteinG',
  'carbsTotalG',
  'fatG',
  'fiberG',
  'ironMg',
  'calciumMg',
  'sodiumMg',
] as const;
export type DetailNutrient = (typeof DETAIL_NUTRIENTS)[number];

export interface Source {
  kind: 'INS' | 'USDA' | 'label' | 'none' | 'dish' | 'user' | 'INS-S' | 'estimated';
  code: string | null;
}

export interface ItemDetail {
  source: Source;
  /** Grams in one serving; null when the food has no household unit (values are then per 100 g). */
  servingGrams: number | null;
  perServing: Record<DetailNutrient, number | null>;
  /** Share of the serving's grams with a known value (1 = all, 0 = "sin dato"). */
  coverage: Record<DetailNutrient, number>;
  ingredients: { name: string; grams: number; source: Source }[];
}

type Per100g = Record<string, number | null> | null;

const sourceOf = (kind: string, code: string | null): Source => ({
  kind: kind as Source['kind'],
  code,
});

/**
 * What a dish or food is made of and where its numbers come from (F06). Every value is computed from the
 * ingredients like the totals are; an unknown value stays null ("sin dato") and lowers the coverage, never 0.
 */
export async function itemDetail(
  db: Db,
  item: { kind: 'dish' | 'food'; id: string },
): Promise<ItemDetail> {
  if (item.kind === 'food') {
    const [row] = await db.select().from(food).where(eq(food.id, item.id));
    if (!row) throw new Error(`unknown food ${item.id}`);
    const [unit] = await db
      .select()
      .from(foodUnit)
      .where(eq(foodUnit.foodId, item.id))
      .orderBy(asc(foodUnit.position))
      .limit(1);
    const grams = unit?.grams ?? null;
    return {
      ...totalsOf([{ per100g: row.per100g, grams: grams ?? 100 }], 1),
      source: sourceOf(row.sourceKind, row.sourceCode),
      servingGrams: grams,
      ingredients: [],
    };
  }

  const seed = (await db.select().from(dish).where(eq(dish.id, item.id)))[0];
  if (seed?.source === 'INS-S') return insDishDetail(seed);
  const [servings, items, source] = seed
    ? [
        seed.servings,
        await db
          .select({ foodId: dishItem.foodId, grams: dishItem.grams })
          .from(dishItem)
          .where(eq(dishItem.dishId, item.id))
          .orderBy(asc(dishItem.position)),
        sourceOf(seed.source === 'estimated' ? 'estimated' : 'dish', null),
      ]
    : await userDishParts(db, item.id);

  const foods = await db
    .select()
    .from(food)
    .where(inArray(food.id, [...new Set(items.map((i) => i.foodId))]));
  const byId = new Map(foods.map((f) => [f.id, f]));
  const totals = totalsOf(
    items.map((i) => ({ per100g: byId.get(i.foodId)?.per100g ?? null, grams: i.grams })),
    servings,
  );
  return {
    ...totals,
    source,
    ingredients: items.map((i) => {
      const f = byId.get(i.foodId);
      return {
        name: f?.name ?? i.foodId,
        grams: i.grams,
        source: sourceOf(f?.sourceKind ?? 'none', f?.sourceCode ?? null),
      };
    }),
  };
}

/** An INS group S dish (ADR 0028): its official values as printed, no ingredients. */
function insDishDetail(seed: typeof dish.$inferSelect): ItemDetail {
  const perServing = Object.fromEntries(
    DETAIL_NUTRIENTS.map((key) => [key, seed.perServing?.[key] ?? null]),
  ) as Record<DetailNutrient, number | null>;
  const coverage = Object.fromEntries(
    DETAIL_NUTRIENTS.map((key) => [key, perServing[key] === null ? 0 : 1]),
  ) as Record<DetailNutrient, number>;
  return {
    source: sourceOf('INS-S', seed.sourceCode),
    servingGrams: seed.servingGrams,
    perServing,
    coverage,
    ingredients: [],
  };
}

async function userDishParts(
  db: Db,
  id: string,
): Promise<[number, { foodId: string; grams: number }[], Source]> {
  const [own] = await db
    .select()
    .from(userDish)
    .where(and(eq(userDish.id, id), isNull(userDish.deletedAt)));
  if (!own) throw new Error(`unknown dish ${id}`);
  const items = await db
    .select({ foodId: userDishItem.foodId, grams: userDishItem.grams })
    .from(userDishItem)
    .where(and(eq(userDishItem.userDishId, id), isNull(userDishItem.deletedAt)))
    .orderBy(asc(userDishItem.position));
  return [own.servings, items, sourceOf('user', null)];
}

function totalsOf(items: { per100g: Per100g; grams: number }[], servings: number) {
  const totals = recipeTotals(items, servings, DETAIL_NUTRIENTS);
  return {
    servingGrams: totals.servingGrams,
    perServing: totals.perServing as Record<DetailNutrient, number | null>,
    coverage: totals.coverage,
  };
}
