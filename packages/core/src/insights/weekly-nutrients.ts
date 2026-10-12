import { dailyReferences, WEEKLY_NUTRIENTS, type WeeklyNutrient } from '../nutrition/references';

/** One logged day: how many meals had entries, its calorie target, and what was eaten. */
export interface NutrientDay {
  meals: number;
  targetKcal: number | null;
  entries: readonly { grams: number; per100g: Readonly<Record<string, number | null>> | null }[];
}

export type NutrientTone = 'green' | 'yellow' | 'red' | 'incomplete';

export interface NutrientRow {
  key: WeeklyNutrient;
  /** Average per counted day. */
  intake: number;
  reference: number;
  /** intake ÷ reference × 100. */
  percent: number;
  tone: NutrientTone;
  /** Share of the eaten grams whose food reports this nutrient (0–1). */
  coverage: number;
}

/** A day counts with at least 2 meals; the view needs 4 such days. */
const MIN_MEALS = 2;
const MIN_DAYS = 4;
/** Below this coverage the row is grey "incomplete data", never a colour. */
const MIN_COVERAGE = 0.8;
const ORDER: readonly NutrientTone[] = ['red', 'yellow', 'green', 'incomplete'];

function toneOf(
  key: WeeklyNutrient,
  intake: number,
  percent: number,
): Exclude<NutrientTone, 'incomplete'> {
  if (key === 'sodiumMg') return intake <= 2000 ? 'green' : intake <= 2300 ? 'yellow' : 'red';
  if (percent >= 100) return 'green';
  return percent >= 70 ? 'yellow' : 'red';
}

/**
 * Vitamins, minerals and fibre of the week (F19): averages over the days with 2+ meals, against the references for
 * the user's sex and age. Unknown values lower the coverage instead of counting as zero. Reds first.
 */
export function weeklyNutrients({
  days,
  sex,
  ageYears,
}: {
  days: readonly NutrientDay[];
  sex: 'male' | 'female';
  ageYears: number;
}):
  | { status: 'need-days'; countedDays: number; neededDays: number }
  | { status: 'ok'; countedDays: number; rows: NutrientRow[] } {
  const counted = days.filter((d) => d.meals >= MIN_MEALS);
  if (counted.length < MIN_DAYS)
    return { status: 'need-days', countedDays: counted.length, neededDays: MIN_DAYS };

  const targets = counted.map((d) => d.targetKcal).filter((k): k is number => k !== null);
  const targetKcal = targets.length ? targets.reduce((a, b) => a + b, 0) / targets.length : 2000;
  const references = dailyReferences({ sex, ageYears, targetKcal });
  const entries = counted.flatMap((d) => d.entries);
  const totalGrams = entries.reduce((sum, e) => sum + e.grams, 0);

  const rows = WEEKLY_NUTRIENTS.map((key): NutrientRow => {
    let amount = 0;
    let coveredGrams = 0;
    for (const e of entries) {
      const per100 = e.per100g?.[key];
      if (per100 === null || per100 === undefined) continue;
      amount += (per100 * e.grams) / 100;
      coveredGrams += e.grams;
    }
    const intake = amount / counted.length;
    const reference = references[key];
    const percent = (intake / reference) * 100;
    const coverage = totalGrams > 0 ? coveredGrams / totalGrams : 0;
    const tone = coverage < MIN_COVERAGE ? 'incomplete' : toneOf(key, intake, percent);
    return { key, intake, reference, percent, tone, coverage };
  });
  rows.sort((a, b) => ORDER.indexOf(a.tone) - ORDER.indexOf(b.tone) || a.percent - b.percent);
  return { status: 'ok', countedDays: counted.length, rows };
}
