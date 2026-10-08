import {
  emptyNutrients,
  fromCsvRow,
  NUTRIENT_KEYS,
  type NutrientKey,
  type Nutrients,
} from './nutrients.ts';
import type { FoodMatch, SeedFood, Unit } from './seed.ts';

export interface Sources {
  /** INS rows by code (A1…U87). */
  ins: Map<string, Record<string, string>>;
  /** USDA SR Legacy rows by FDC id. */
  usda: Map<string, Record<string, string>>;
}

export type FoodStatus = 'ok' | 'proxy' | 'label-pending' | 'unmatched';

export interface ResolvedFood {
  id: string;
  name: string;
  state: SeedFood['state'];
  units: Unit[];
  source: { kind: 'INS' | 'USDA' | 'label' | 'none'; code?: string; name?: string };
  /** As eaten, per 100 g; null while the food has no source values. */
  per100g: Nutrients | null;
  status: FoodStatus;
  filledFrom?: { fdcId: number; nutrients: NutrientKey[] };
  cookedToRaw?: FoodMatch['cookedToRaw'];
  notes: string[];
}

const GAP_FILLED: NutrientKey[] = ['vitaminB12Ug', 'vitaminDUg'];

function row(table: Map<string, Record<string, string>>, key: string, source: string) {
  const found = table.get(key);
  if (!found) throw new Error(`${source} row ${key} does not exist`);
  return found;
}

/** Nutrients of the cooked food from its raw row: everything scales by the factor except water. */
function cooked(raw: Nutrients, factor: number): Nutrients {
  const out = emptyNutrients();
  for (const key of NUTRIENT_KEYS) {
    const value = raw[key];
    out[key] = value === null ? null : value * factor;
  }
  out.waterG = raw.waterG === null ? null : 100 - (100 - raw.waterG) * factor;
  return out;
}

function fromLabel(food: SeedFood): Nutrients | null {
  const label = food.label;
  const serving = label?.servingGrams;
  if (!label || !serving) return null;
  const per100 = (value: number | undefined) =>
    value === undefined ? null : (value / serving) * 100;
  return {
    ...emptyNutrients(),
    energyKcal: per100(label.kcal),
    proteinG: per100(label.protein),
    fatG: per100(label.fat),
    carbsTotalG: per100(label.carbs),
    sodiumMg: per100(label.sodiumMg),
  };
}

/** One seed food with its source values per 100 g as eaten (ADR 0014). */
export function resolveFood(
  id: string,
  food: SeedFood,
  match: FoodMatch,
  sources: Sources,
): ResolvedFood {
  const base = { id, name: food.name, state: food.state, units: food.units };
  const notes = [match.note, match.proxy && `Proxy: ${match.proxy}`].filter(
    (n): n is string => !!n,
  );

  if (match.unmatched) {
    return {
      ...base,
      source: { kind: 'none' },
      per100g: null,
      status: 'unmatched',
      notes: [match.unmatched, ...notes],
    };
  }
  if (match.none) {
    const water = Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, 0])) as Nutrients;
    return {
      ...base,
      source: { kind: 'none' },
      per100g: { ...water, waterG: 100 },
      status: 'ok',
      notes,
    };
  }
  if (match.label) {
    const per100g = fromLabel(food);
    return {
      ...base,
      source: { kind: 'label', ...(food.label && { name: food.label.from }) },
      per100g,
      status: per100g ? 'ok' : 'label-pending',
      notes,
    };
  }
  if (match.usda !== undefined) {
    const usda = row(sources.usda, String(match.usda), 'USDA');
    return {
      ...base,
      source: { kind: 'USDA', code: String(match.usda), name: usda.name ?? '' },
      per100g: fromCsvRow(usda),
      status: match.proxy ? 'proxy' : 'ok',
      notes,
    };
  }
  if (!match.ins) throw new Error(`${id}: the match names no source`);

  const ins = row(sources.ins, match.ins, 'INS');
  const raw = fromCsvRow(ins);
  const per100g = match.cookedToRaw ? cooked(raw, match.cookedToRaw.factor) : raw;
  let filledFrom: ResolvedFood['filledFrom'];
  if (match.fill !== undefined) {
    const usda = fromCsvRow(row(sources.usda, String(match.fill), 'USDA'));
    for (const key of GAP_FILLED) per100g[key] = usda[key];
    filledFrom = { fdcId: match.fill, nutrients: GAP_FILLED };
  } else if (match.plant) {
    for (const key of GAP_FILLED) per100g[key] = 0;
  }
  return {
    ...base,
    source: { kind: 'INS', code: match.ins, name: ins.name ?? '' },
    per100g,
    status: match.proxy ? 'proxy' : 'ok',
    ...(filledFrom && { filledFrom }),
    ...(match.cookedToRaw && { cookedToRaw: match.cookedToRaw }),
    notes,
  };
}
