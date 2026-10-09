/** Nutrients per 100 g of edible portion, in the column order of the source CSVs. */
export const NUTRIENTS = {
  energyKcal: 'energy_kcal',
  waterG: 'water_g',
  proteinG: 'protein_g',
  fatG: 'fat_g',
  saturatedFatG: 'saturated_fat_g',
  transFatG: 'trans_fat_g',
  cholesterolMg: 'cholesterol_mg',
  carbsTotalG: 'carbs_total_g',
  carbsAvailableG: 'carbs_available_g',
  fiberG: 'fiber_g',
  ashG: 'ash_g',
  calciumMg: 'calcium_mg',
  phosphorusMg: 'phosphorus_mg',
  zincMg: 'zinc_mg',
  ironMg: 'iron_mg',
  sodiumMg: 'sodium_mg',
  potassiumMg: 'potassium_mg',
  vitaminARaeUg: 'vitamin_a_rae_ug',
  thiaminMg: 'thiamin_mg',
  riboflavinMg: 'riboflavin_mg',
  niacinMg: 'niacin_mg',
  vitaminCMg: 'vitamin_c_mg',
  folateUg: 'folate_ug',
  vitaminB12Ug: 'vitamin_b12_ug',
  vitaminDUg: 'vitamin_d_ug',
} as const;

export type NutrientKey = keyof typeof NUTRIENTS;
export type Nutrients = Record<NutrientKey, number | null>;

export const NUTRIENT_KEYS = Object.keys(NUTRIENTS) as NutrientKey[];

export function emptyNutrients(): Nutrients {
  return Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, null])) as Nutrients;
}

/** Empty or absent cells are unknown (null), never zero. */
export function fromCsvRow(row: Record<string, string>): Nutrients {
  const nutrients = emptyNutrients();
  for (const key of NUTRIENT_KEYS) {
    const cell = row[NUTRIENTS[key]];
    if (cell !== undefined && cell !== '') nutrients[key] = Number(cell);
  }
  return nutrients;
}
