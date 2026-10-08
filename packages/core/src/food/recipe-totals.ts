import { assertPositive } from '../shared/assert';

/** Nutrients per 100 g; `null` means the source has no value ("sin dato"), never 0 (F06). */
export type Nutrients<K extends string = string> = Record<K, number | null>;

export interface RecipeItem<K extends string> {
  /** null while the food has no source values (unmatched or label pending). */
  per100g: Readonly<Nutrients<K>> | null;
  grams: number;
}

export interface RecipeTotals<K extends string> {
  /** Grams in one serving. */
  servingGrams: number;
  perServing: Nutrients<K>;
  per100g: Nutrients<K>;
  /** Share of the recipe's grams whose food reports each nutrient, 0–1 (F06). */
  coverage: Record<K, number>;
}

/**
 * Totals of a recipe from its ingredients in grams (seed dishes, ADR 0014; user dishes, F07). Unknown values are
 * left out and lower the coverage; a nutrient no ingredient reports stays null. A recipe yields `servings` servings.
 */
export function recipeTotals<K extends string>(
  items: readonly RecipeItem<K>[],
  servings: number,
  keys: readonly K[],
): RecipeTotals<K> {
  assertPositive({ servings });
  const recipeGrams = items.reduce((sum, item) => sum + item.grams, 0);
  assertPositive({ recipeGrams });
  const sums = Object.fromEntries(keys.map((k) => [k, null])) as Nutrients<K>;
  const known = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  for (const item of items) {
    if (!item.per100g) continue;
    for (const key of keys) {
      const value = item.per100g[key];
      if (value === null || value === undefined) continue;
      sums[key] = (sums[key] ?? 0) + (value * item.grams) / 100;
      known[key] += item.grams;
    }
  }
  const perServing = { ...sums };
  const per100g = { ...sums };
  const coverage = { ...known };
  for (const key of keys) {
    const sum = sums[key];
    perServing[key] = sum === null ? null : sum / servings;
    per100g[key] = sum === null ? null : (sum / recipeGrams) * 100;
    coverage[key] = known[key] / recipeGrams;
  }
  return { servingGrams: recipeGrams / servings, perServing, per100g, coverage };
}
