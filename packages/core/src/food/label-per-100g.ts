/** Nutrients a Peruvian or imported food label prints, in label order (F23 piece 3). */
export const LABEL_NUTRIENTS = [
  'energyKcal',
  'fatG',
  'saturatedFatG',
  'transFatG',
  'cholesterolMg',
  'sodiumMg',
  'carbsTotalG',
  'fiberG',
  'sugarsTotalG',
  'addedSugarG',
  'proteinG',
] as const;
export type LabelNutrient = (typeof LABEL_NUTRIENTS)[number];

/** A label as read or typed: its numbers per 100 g or per serving, null where the label prints nothing. */
export interface LabelValues {
  basis: 'per100g' | 'perServing';
  /** Grams (or ml) in one serving; required when the numbers are per serving. */
  servingGrams: number | null;
  values: Partial<Record<LabelNutrient, number | null>>;
  /** Made with refined flour (F24): its available carbohydrate counts as refined-flour carbohydrate. */
  refinedFlour: boolean;
}

/**
 * The label's numbers per 100 g, the unit every catalog food uses (ADR 0014). Per-serving numbers are scaled by
 * 100 / serving grams; ml count as g. A missing number stays null ("sin dato"), never 0. Derived values follow the
 * catalog: available carbohydrate = total − fiber, and refined-flour carbohydrate = available when the product is
 * made with refined flour, else 0.
 */
export function labelPer100g(label: LabelValues): Record<string, number | null> {
  let scale = 1;
  if (label.basis === 'perServing') {
    if (label.servingGrams === null || !(label.servingGrams > 0)) {
      throw new Error('per-serving values need the grams of one serving');
    }
    scale = 100 / label.servingGrams;
  }
  const out: Record<string, number | null> = {};
  for (const key of LABEL_NUTRIENTS) {
    const value = label.values[key];
    out[key] = value === null || value === undefined ? null : value * scale;
  }
  const carbs = out.carbsTotalG ?? null;
  const available = carbs === null ? null : Math.max(0, carbs - (out.fiberG ?? 0));
  out.carbsAvailableG = available;
  out.refinedFlourCarbsG = label.refinedFlour ? available : 0;
  return out;
}

/**
 * How far the printed energy is from the energy its macronutrients give (Atwater: 4 kcal/g protein and available
 * carbohydrate, 9 kcal/g fat, 2 kcal/g fiber), as a share of the printed energy. A big gap usually means a number
 * was misread (a serving value in the 100 g column, a missing decimal point); null when a number is missing.
 */
export function energyGap(per100g: Record<string, number | null>): number | null {
  const { energyKcal, proteinG, fatG, carbsTotalG } = per100g;
  if (energyKcal == null || proteinG == null || fatG == null || carbsTotalG == null) return null;
  const fiber = per100g.fiberG ?? 0;
  const fromMacros = 4 * proteinG + 9 * fatG + 4 * Math.max(0, carbsTotalG - fiber) + 2 * fiber;
  if (energyKcal === 0) return fromMacros === 0 ? 0 : 1;
  return Math.abs(fromMacros - energyKcal) / energyKcal;
}
