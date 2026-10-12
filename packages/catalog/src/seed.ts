/** Shapes of seed/foods.json, seed/dishes.json and seed/matches.json. */

export interface Unit {
  label: string;
  grams: number | null;
}

/** Values printed on a package label, per serving (or per 100 g in `per100g`). */
export interface LabelValues {
  kcal?: number;
  carbs?: number;
  sugars?: number;
  addedSugars?: number;
  fiber?: number;
  fat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterolMg?: number;
  protein?: number;
  sodiumMg?: number;
  calciumMg?: number;
  ironMg?: number;
  potassiumMg?: number;
}

export interface LabelFacts extends LabelValues {
  servingGrams: number | null;
  /** The label's own per 100 g column: used as printed instead of scaling the serving. */
  per100g?: LabelValues;
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
