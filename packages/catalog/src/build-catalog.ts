import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { crossCheck, type CrossCheck, type Survey } from './cross-check.ts';
import { parseCsv } from './csv.ts';
import { dishTotals, type DishTotals } from './dish-totals.ts';
import { insDish, type DishSource, type InsDishRow } from './ins-dishes.ts';
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
  /** Added sugar per 100 g of packaged and prepared foods (F22). */
  addedSugar: Record<string, { g: number; from?: string; doubtful?: true }>;
  /** Food ids per tag (seed/tags). */
  tags: Record<Tag, string[]>;
  /** INS group S preparations as dishes (ADR 0028 layer 1). */
  insDishes: InsDishRow[];
}

export const TAGS = ['refined-flour', 'drink'] as const;
export type Tag = (typeof TAGS)[number];

export interface Catalog {
  version: string;
  sources: { ins: string; usda: string };
  foods: ResolvedFood[];
  dishes: (SeedDish & {
    totals: DishTotals;
    tags: Tag[];
    source: DishSource;
    sourceCode?: string;
  })[];
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
    addedSugar: json<{ foods: Inputs['addedSugar'] }>('seed/added-sugar.json').foods,
    insDishes: json<{ dishes: InsDishRow[] }>('seed/generated/ins-dishes.json').dishes,
    tags: Object.fromEntries(
      TAGS.map((tag) => [tag, json<{ foods: string[] }>(`seed/tags/${tag}.json`).foods]),
    ) as Inputs['tags'],
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

/**
 * Added sugar per 100 g (F22): the seed list wins, then the label (added sugars, else total sugars), else none.
 */
function withAddedSugar(
  resolved: ResolvedFood,
  food: SeedFood,
  listed: { g: number } | undefined,
): ResolvedFood {
  if (!resolved.per100g) return resolved;
  const label = food.label;
  const printed = label?.per100g ?? label;
  const scale = label?.per100g ? 1 : label?.servingGrams ? 100 / label.servingGrams : null;
  const fromLabel =
    printed && scale !== null ? (printed.addedSugars ?? printed.sugars ?? null) : null;
  const grams = listed?.g ?? (fromLabel === null ? 0 : fromLabel * (scale ?? 1));
  return { ...resolved, per100g: { ...resolved.per100g, addedSugarG: grams } };
}

/** State of an INS row from its name, for the generic foods (F23). */
function stateFromName(name: string): SeedFood['state'] {
  if (/frit[oa]/i.test(name)) return 'fried';
  if (/cocid|sancochad|hervid|asad|tostad/i.test(name)) return 'cooked';
  if (/crud[oa]/i.test(name)) return 'raw';
  return 'as-sold';
}

/**
 * Every INS row the seed does not already curate, as a generic food (F23 piece 2): its INS name, grams only, the
 * values as INS prints them. Added sugar comes from the list (0 when not listed: INS foods are unsweetened unless
 * named there).
 */
function genericFoods(inputs: Inputs, curatedCodes: ReadonlySet<string>): ResolvedFood[] {
  return [...inputs.sources.ins.values()]
    .filter((row) => !curatedCodes.has(row.code ?? ''))
    .map((row) => {
      const code = row.code ?? '';
      const id = `ins-${code.toLowerCase()}`;
      const seed: SeedFood = {
        name: (row.name ?? code).trim(),
        source: 'INS',
        state: stateFromName(row.name ?? ''),
        units: [],
      };
      const resolved = withAddedSugar(
        resolveFood(id, seed, { ins: code }, inputs.sources),
        seed,
        inputs.addedSugar[id],
      );
      return { ...resolved, generic: true as const };
    });
}

/** Tags from seed/tags, and the refined-flour carbohydrate they imply (F24). A tag on an unknown id fails. */
function withTags(foods: ResolvedFood[], tags: Inputs['tags']): ResolvedFood[] {
  const ids = new Set(foods.map((f) => f.id));
  for (const tag of TAGS) {
    const unknown = tags[tag].filter((id) => !ids.has(id));
    if (unknown.length)
      throw new Error(`seed/tags/${tag}.json names unknown foods: ${unknown.join(', ')}`);
  }
  return foods.map((food) => {
    const own = TAGS.filter((tag) => tags[tag].includes(food.id));
    if (!food.per100g) return { ...food, tags: own };
    const flour = own.includes('refined-flour') ? food.per100g.carbsTotalG : 0;
    return { ...food, tags: own, per100g: { ...food.per100g, refinedFlourCarbsG: flour } };
  });
}

/** A dish is refined flour when an ingredient is, and a drink when its group is (F24, ADR 0020). */
function dishTags(dish: SeedDish, byId: ReadonlyMap<string, ResolvedFood>): Tag[] {
  const tags: Tag[] = [];
  if (dish.items.some((item) => byId.get(item.food)?.tags.includes('refined-flour')))
    tags.push('refined-flour');
  if (dish.group === 'drink') tags.push('drink');
  return tags;
}

/** Seed + matches + sources → the catalog the app bundles (ADR 0014). Throws on any broken link. */
export function buildCatalog(inputs: Inputs): Catalog {
  const curated = Object.entries(inputs.foods).map(([id, food]) => {
    const match = inputs.matches.foods[id];
    if (!match) throw new Error(`${id} has no entry in seed/matches.json`);
    return withAddedSugar(
      resolveFood(id, food, match, inputs.sources),
      food,
      inputs.addedSugar[id],
    );
  });
  const curatedCodes = new Set(
    curated.flatMap((f) => (f.source.kind === 'INS' && f.source.code ? [f.source.code] : [])),
  );
  const foods = withTags([...curated, ...genericFoods(inputs, curatedCodes)], inputs.tags);
  const byId = new Map(foods.map((food) => [food.id, food]));
  const curatedDishes = inputs.dishes.map((dish) => ({
    ...dish,
    totals: dishTotals(dish, byId),
    tags: dishTags(dish, byId),
    source: 'curated' as const,
  }));
  const taken = new Set(curatedDishes.map((d) => d.id));
  const dishes = [
    ...curatedDishes,
    ...inputs.insDishes.filter((row) => !taken.has(row.id)).map(insDish),
  ];
  const crossChecks = Object.entries(inputs.matches.groupS).map(([dishId, link]) => {
    const dish = curatedDishes.find((d) => d.id === dishId);
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
  // The app reloads its catalog only when this changes, so it must depend on the data, not on the build date.
  const version = createHash('sha256')
    .update(JSON.stringify({ foods, dishes }))
    .digest('hex')
    .slice(0, 16);
  return {
    version,
    sources: {
      ins: 'INS/CENAN, Tablas Peruanas de Composición de Alimentos, 2023 (11th digital edition, 2025)',
      usda: 'USDA FoodData Central, SR Legacy (April 2018)',
    },
    foods,
    dishes,
    crossChecks,
  };
}
