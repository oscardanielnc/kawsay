import { NUTRIENT_KEYS, NUTRIENTS, type Nutrients } from './nutrients.ts';
import type { DishTotals } from './dish-totals.ts';
import type { SeedDish } from './seed.ts';

/** One dish of seed/generated/ins-dishes.json (scripts/build_ins_dishes.py, ADR 0028 layer 1). */
export interface InsDishRow {
  id: string;
  name: string;
  group: string;
  icon: string;
  source: { kind: 'INS-S'; code: string };
  confidence: SeedDish['confidence'];
  /** Snake-case columns as in the INS CSVs. */
  per100g: Record<string, number | null>;
  addedSugarPer100g: number;
  refinedFlourCarbsPer100g: number;
  serving: { label: string; grams: number };
}

/** Where a catalog dish comes from: curated from its ingredients, INS group S, or an estimated recipe (ADR 0028). */
export type DishSource = 'curated' | 'INS-S' | 'estimated';

/**
 * An INS group S preparation as a catalog dish: no ingredients, its official values per 100 g, one serving of its
 * plate. Added sugar and refined-flour carbohydrate come from the explicit rules recorded in the file.
 */
export function insDish(row: InsDishRow): SeedDish & {
  source: DishSource;
  sourceCode: string;
  totals: DishTotals;
  tags: ('refined-flour' | 'drink')[];
} {
  const per100g = Object.fromEntries(
    NUTRIENT_KEYS.map((key) => [key, row.per100g[NUTRIENTS[key]] ?? null]),
  ) as Nutrients;
  per100g.addedSugarG = row.addedSugarPer100g;
  per100g.refinedFlourCarbsG = row.refinedFlourCarbsPer100g;
  const grams = row.serving.grams;
  const perServing = Object.fromEntries(
    NUTRIENT_KEYS.map((key) => {
      const v = per100g[key];
      return [key, v === null ? null : (v * grams) / 100];
    }),
  ) as Nutrients;
  const coverage = Object.fromEntries(
    NUTRIENT_KEYS.map((key) => [key, per100g[key] === null ? 0 : 1]),
  ) as DishTotals['coverage'];
  const tags: ('refined-flour' | 'drink')[] = [];
  if (row.refinedFlourCarbsPer100g > 0) tags.push('refined-flour');
  if (row.group === 'drink') tags.push('drink');
  return {
    id: row.id,
    name: row.name,
    group: row.group,
    icon: row.icon,
    confidence: row.confidence,
    serving: row.serving.label,
    servings: 1,
    items: [],
    source: 'INS-S',
    sourceCode: row.source.code,
    totals: { grams, perServing, per100g, coverage, missingFoods: [] },
    tags,
  };
}
