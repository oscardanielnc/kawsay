/** Shapes of seed/foods.json, seed/dishes.json and seed/matches.json. */

export interface Unit {
  label: string;
  grams: number | null;
}

export interface LabelFacts {
  servingGrams: number | null;
  kcal?: number;
  carbs?: number;
  sugars?: number;
  fat?: number;
  protein?: number;
  sodiumMg?: number;
  from: string;
}

export interface SeedFood {
  name: string;
  source: 'INS' | 'USDA' | 'label' | 'none';
  state: 'raw' | 'cooked' | 'fried' | 'as-sold';
  units: Unit[];
  label?: LabelFacts;
}

export interface FoodMatch {
  ins?: string;
  usda?: number;
  label?: true;
  none?: true;
  unmatched?: string;
  /** Cooked weight × factor = raw weight; applied when the source row is raw and the food is eaten cooked. */
  cookedToRaw?: { factor: number; ref: string };
  /** USDA food that supplies B12 and vitamin D, which INS does not report. */
  fill?: number;
  /** Plant food: B12 and vitamin D are zero. */
  plant?: true;
  proxy?: string;
  note?: string;
  insAlternative?: string;
  usdaAlternative?: number;
}

export interface SeedDish {
  id: string;
  name: string;
  group: string;
  icon: string;
  confidence: 'high' | 'medium' | 'low';
  serving: string;
  servings: number;
  items: { food: string; grams: number }[];
  note?: string;
}
