import { readFileSync } from 'node:fs';
import { crossCheck, type CrossCheck, type Survey } from './cross-check.ts';
import { parseCsv } from './csv.ts';
import { dishTotals, type DishTotals } from './dish-totals.ts';
import { resolveFood, type ResolvedFood, type Sources } from './resolve-food.ts';
import type { FoodMatch, SeedDish, SeedFood } from './seed.ts';

export interface Inputs {
  foods: Record<string, SeedFood>;
  dishes: SeedDish[];
  matches: {
    foods: Record<string, FoodMatch>;
    /** Seed dish → its group S code and, when ENCONUT lists it, the component name there. */
    groupS: Record<string, { code: string; enconut?: string; accepted?: string }>;
  };
  sources: Sources;
  prepared: Record<string, string>[];
  /** INEI ENCONUT 2013 summary by component name. */
  survey: Map<string, Survey>;
}

export interface Catalog {
  version: string;
  sources: { ins: string; usda: string };
  foods: ResolvedFood[];
  dishes: (SeedDish & { totals: DishTotals })[];
  crossChecks: (CrossCheck & { dish: string; acceptedBecause?: string })[];
}

/** Reads seed/ and sources/ from the package root. */
export function readInputs(root: URL): Inputs {
  const text = (path: string) => readFileSync(new URL(path, root), 'utf8');
  const json = <T>(path: string) => JSON.parse(text(path)) as T;
  const byKey = (rows: Record<string, string>[], key: string) =>
    new Map(rows.map((row) => [row[key] ?? '', row]));
  return {
    foods: json<{ foods: Record<string, SeedFood> }>('seed/foods.json').foods,
    dishes: json<{ dishes: SeedDish[] }>('seed/dishes.json').dishes,
    matches: json<Inputs['matches']>('seed/matches.json'),
    sources: {
      ins: byKey(parseCsv(text('sources/ins-2023/foods.csv')), 'code'),
      usda: byKey(parseCsv(text('sources/usda-sr-legacy/foods.csv')), 'fdc_id'),
    },
    prepared: parseCsv(text('sources/ins-2023/prepared.csv')),
    survey: new Map(
      parseCsv(text('sources/inei-enconut-2013/components.csv')).map((row) => [
        row.component ?? '',
        {
          establishments: Number(row.establishments),
          kcalPer100gMin: Number(row.kcal_100g_min),
          kcalPer100gMax: Number(row.kcal_100g_max),
        },
      ]),
    ),
  };
}

/** Seed + matches + sources → the catalog the app bundles (ADR 0014). Throws on any broken link. */
export function buildCatalog(inputs: Inputs): Catalog {
  const foods = Object.entries(inputs.foods).map(([id, food]) => {
    const match = inputs.matches.foods[id];
    if (!match) throw new Error(`${id} has no entry in seed/matches.json`);
    return resolveFood(id, food, match, inputs.sources);
  });
  const byId = new Map(foods.map((food) => [food.id, food]));
  const dishes = inputs.dishes.map((dish) => ({ ...dish, totals: dishTotals(dish, byId) }));
  const crossChecks = Object.entries(inputs.matches.groupS).map(([dishId, link]) => {
    const dish = dishes.find((d) => d.id === dishId);
    if (!dish) throw new Error(`groupS names an unknown dish: ${dishId}`);
    let survey: Survey | null = null;
    if (link.enconut) {
      survey = inputs.survey.get(link.enconut) ?? null;
      if (!survey) throw new Error(`${dishId}: ENCONUT has no component ${link.enconut}`);
    }
    const kcal = dish.totals.per100g.energyKcal ?? 0;
    const check = crossCheck({
      dishKcalPer100g: kcal,
      code: link.code,
      rows: inputs.prepared,
      survey,
    });
    // A deviation the owner reviewed and kept on purpose stays visible, with its reason.
    if (link.accepted && check.verdict === 'outside') {
      return {
        dish: dishId,
        ...check,
        verdict: 'accepted' as const,
        acceptedBecause: link.accepted,
      };
    }
    return { dish: dishId, ...check };
  });
  return {
    version: new Date().toISOString().slice(0, 10),
    sources: {
      ins: 'INS/CENAN, Tablas Peruanas de Composición de Alimentos, 2023 (11th digital edition, 2025)',
      usda: 'USDA FoodData Central, SR Legacy (April 2018)',
    },
    foods,
    dishes,
    crossChecks,
  };
}
