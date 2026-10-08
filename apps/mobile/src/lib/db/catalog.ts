import { dish, dishItem, food, foodUnit, meta } from './schema';
import { inTransaction } from './transaction';
import type { Db } from './types';

/** The part of `@kawsay/catalog/catalog.json` the app stores. */
export interface BundledCatalog {
  version: string;
  foods: {
    id: string;
    name: string;
    state: string;
    units: { label: string; grams: number | null }[];
    source: { kind: string; code?: string };
    per100g: Record<string, number | null> | null;
  }[];
  dishes: {
    id: string;
    name: string;
    group: string;
    icon: string;
    serving: string;
    servings: number;
    items: { food: string; grams: number }[];
    totals: {
      grams: number;
      perServing: Record<string, number | null>;
      per100g: Record<string, number | null>;
    };
  }[];
}

const CHUNK = 200;
/** Bump when the loader stores something new, so phones reload a catalog whose data did not change. */
export const LOADER_VERSION = '2';

async function insertChunked<T>(
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) await insert(rows.slice(i, i + CHUNK));
}

/** Loads the bundled catalog into SQLite when its content hash changed (ADR 0014); otherwise leaves it as it is. */
export async function loadCatalog(
  db: Db,
  catalog: BundledCatalog,
): Promise<'loaded' | 'up-to-date'> {
  const stored = new Map((await db.select().from(meta)).map((row) => [row.key, row.value]));
  if (
    stored.get('catalogVersion') === catalog.version &&
    stored.get('catalogLoader') === LOADER_VERSION
  ) {
    return 'up-to-date';
  }

  await inTransaction(db, async () => {
    for (const table of [dishItem, dish, foodUnit, food]) await db.delete(table);
    await insertChunked(
      catalog.foods.map((f) => ({
        id: f.id,
        name: f.name,
        state: f.state,
        sourceKind: f.source.kind,
        sourceCode: f.source.code ?? null,
        per100g: f.per100g,
      })),
      (rows) => db.insert(food).values(rows),
    );
    await insertChunked(
      catalog.foods.flatMap((f) =>
        f.units.map((u, position) => ({ foodId: f.id, label: u.label, grams: u.grams, position })),
      ),
      (rows) => db.insert(foodUnit).values(rows),
    );
    await insertChunked(
      catalog.dishes.map(({ id, name, group, icon, serving, servings, totals }) => ({
        id,
        name,
        group,
        icon,
        serving,
        servings,
        servingGrams: totals.grams,
        perServing: totals.perServing,
        per100g: totals.per100g,
      })),
      (rows) => db.insert(dish).values(rows),
    );
    await insertChunked(
      catalog.dishes.flatMap((d) =>
        d.items.map((item, position) => ({
          dishId: d.id,
          foodId: item.food,
          grams: item.grams,
          position,
        })),
      ),
      (rows) => db.insert(dishItem).values(rows),
    );
    for (const [key, value] of [
      ['catalogVersion', catalog.version],
      ['catalogLoader', LOADER_VERSION],
    ] as const) {
      await db
        .insert(meta)
        .values({ key, value })
        .onConflictDoUpdate({ target: meta.key, set: { value } });
    }
  });
  return 'loaded';
}
