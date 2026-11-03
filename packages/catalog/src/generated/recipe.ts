import { z } from 'zod';
import { dishTotals, type DishTotals } from '../dish-totals.ts';
import type { ResolvedFood } from '../resolve-food.ts';
import type { SeedDish } from '../seed.ts';
import type { Category } from './categories.ts';
import { ICONS } from './categories.ts';

/** A name the list asks a recipe for, with the other names people use (ADR 0028). */
export const DishName = z.object({
  name: z.string().trim().min(3).max(80),
  aliases: z.array(z.string().trim().min(3).max(80)).max(6).default([]),
});
export type DishName = z.infer<typeof DishName>;
export const DishNames = z.object({ names: z.array(DishName) });

/**
 * What the AI returns for one dish: catalog ids, grams, servings, a household unit and an icon. **No nutrient
 * field**: the table computes them (ADR 0008).
 */
export const Recipe = z.object({
  name: z.string().trim().min(3).max(80),
  icon: z.enum(ICONS),
  /** One serving in household words: "1 plato", "1 tajada", "1 vaso". */
  serving: z.string().trim().min(3).max(40),
  /** Servings the ingredient grams make. */
  servings: z.number().positive().max(40),
  items: z
    .array(z.object({ food: z.string().min(1), grams: z.number().positive().max(5000) }))
    .min(1)
    .max(25),
});
export type Recipe = z.infer<typeof Recipe>;
export const RecipeBatch = z.object({ recipes: z.array(Recipe) });

/** Lower case, no accents, single spaces: names compare by this. */
export function normalizeName(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Keeps the first of every name whose name or alias is already taken (by the catalog or an earlier entry). */
export function dedupeNames(
  names: readonly (DishName & { category: string })[],
  taken: Iterable<string>,
): (DishName & { category: string })[] {
  const seen = new Set([...taken].map(normalizeName));
  const kept: (DishName & { category: string })[] = [];
  for (const entry of names) {
    const keys = [entry.name, ...entry.aliases].map(normalizeName);
    if (keys.some((key) => seen.has(key))) continue;
    keys.forEach((key) => seen.add(key));
    kept.push(entry);
  }
  return kept;
}

export interface Checked {
  ok: boolean;
  errors: string[];
  totals: DishTotals | null;
}

/**
 * The automatic checks of ADR 0028: every id exists, kcal per 100 g and per serving inside the category's range,
 * protein + fat + carbohydrate within 100 g per 100 g, and the energy known for nearly all the grams.
 */
export function checkRecipe(
  recipe: Recipe,
  category: Pick<Category, 'kcalPer100g' | 'kcalPerServing' | 'group'>,
  foods: ReadonlyMap<string, ResolvedFood>,
): Checked {
  const unknown = recipe.items.filter((item) => !foods.has(item.food)).map((item) => item.food);
  if (unknown.length)
    return { ok: false, errors: [`unknown food ids: ${unknown.join(', ')}`], totals: null };
  const dish: SeedDish = {
    id: 'check',
    name: recipe.name,
    group: category.group,
    icon: recipe.icon,
    confidence: 'low',
    serving: recipe.serving,
    servings: recipe.servings,
    items: recipe.items,
  };
  const totals = dishTotals(dish, foods);
  const errors: string[] = [];
  const kcal100 = totals.per100g.energyKcal ?? 0;
  const kcalServing = totals.perServing.energyKcal ?? 0;
  const [lo100, hi100] = category.kcalPer100g;
  const [loServing, hiServing] = category.kcalPerServing;
  if (kcal100 < lo100 || kcal100 > hi100)
    errors.push(`kcal per 100 g ${Math.round(kcal100)} outside ${lo100}–${hi100}`);
  if (kcalServing < loServing || kcalServing > hiServing)
    errors.push(`kcal per serving ${Math.round(kcalServing)} outside ${loServing}–${hiServing}`);
  const { proteinG, fatG, carbsTotalG } = totals.per100g;
  const macros = (proteinG ?? 0) + (fatG ?? 0) + (carbsTotalG ?? 0);
  if (macros > 100) errors.push(`protein + fat + carbohydrate ${Math.round(macros)} g per 100 g`);
  if (totals.coverage.energyKcal < 0.9)
    errors.push(
      `energy known for only ${Math.round(totals.coverage.energyKcal * 100)}% of the grams`,
    );
  return { ok: errors.length === 0, errors, totals };
}

/** A stable id for an estimated dish: "Torta helada" → "est-torta-helada". */
export function estimatedId(name: string): string {
  return `est-${normalizeName(name).replace(/ /g, '-')}`;
}
