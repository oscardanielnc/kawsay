import { emptyNutrients, NUTRIENT_KEYS, type NutrientKey, type Nutrients } from './nutrients.ts';
import type { ResolvedFood } from './resolve-food.ts';
import type { SeedDish } from './seed.ts';

export interface DishTotals {
  /** Grams in one serving. */
  grams: number;
  perServing: Nutrients;
  per100g: Nutrients;
  /** Share of the dish's grams whose food reports the nutrient, 0–1 (F06). */
  coverage: Record<NutrientKey, number>;
  /** Ingredients without source values yet (unmatched or label pending). */
  missingFoods: string[];
}

/** Totals of a seed dish from its ingredients; unknown values are left out and lower the coverage. */
export function dishTotals(dish: SeedDish, foods: ReadonlyMap<string, ResolvedFood>): DishTotals {
  const recipeGrams = dish.items.reduce((sum, item) => sum + item.grams, 0);
  const sums = emptyNutrients();
  const knownGrams = Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, 0])) as Record<
    NutrientKey,
    number
  >;
  const missingFoods: string[] = [];

  for (const item of dish.items) {
    const food = foods.get(item.food);
    if (!food) throw new Error(`${dish.id}: ingredient ${item.food} is not in the catalog`);
    if (!food.per100g) {
      missingFoods.push(item.food);
      continue;
    }
    for (const key of NUTRIENT_KEYS) {
      const value = food.per100g[key];
      if (value === null) continue;
      sums[key] = (sums[key] ?? 0) + (value * item.grams) / 100;
      knownGrams[key] += item.grams;
    }
  }

  const perServing = emptyNutrients();
  const per100g = emptyNutrients();
  const coverage = { ...knownGrams };
  for (const key of NUTRIENT_KEYS) {
    const sum = sums[key];
    perServing[key] = sum === null ? null : sum / dish.servings;
    per100g[key] = sum === null ? null : (sum / recipeGrams) * 100;
    coverage[key] = knownGrams[key] / recipeGrams;
  }
  return { grams: recipeGrams / dish.servings, perServing, per100g, coverage, missingFoods };
}
