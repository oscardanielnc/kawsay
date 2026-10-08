import { recipeTotals } from '@kawsay/core/food/recipe-totals';
import { NUTRIENT_KEYS, type NutrientKey, type Nutrients } from './nutrients.ts';
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

/** Totals of a seed dish from its ingredients (rule in core: `recipeTotals`); unknown values lower the coverage. */
export function dishTotals(dish: SeedDish, foods: ReadonlyMap<string, ResolvedFood>): DishTotals {
  const missingFoods: string[] = [];
  const items = dish.items.map((item) => {
    const food = foods.get(item.food);
    if (!food) throw new Error(`${dish.id}: ingredient ${item.food} is not in the catalog`);
    if (!food.per100g) missingFoods.push(item.food);
    return { per100g: food.per100g, grams: item.grams };
  });
  const totals = recipeTotals<NutrientKey>(items, dish.servings, NUTRIENT_KEYS);
  return {
    grams: totals.servingGrams,
    perServing: totals.perServing,
    per100g: totals.per100g,
    coverage: totals.coverage,
    missingFoods,
  };
}
