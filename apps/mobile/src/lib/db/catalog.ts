import { eq } from 'drizzle-orm';
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
  }[];
}

const CHUNK = 200;

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
  const current = await db.select().from(meta).where(eq(meta.key, 'catalogVersion'));
  if (current[0]?.value === catalog.version) return 'up-to-date';

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
      catalog.dishes.map(({ id, name, group, icon, serving, servings }) => ({
        id,
        name,
        group,
        icon,
        serving,
        servings,
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
    await db
      .insert(meta)
      .values({ key: 'catalogVersion', value: catalog.version })
      .onConflictDoUpdate({ target: meta.key, set: { value: catalog.version } });
  });
  return 'loaded';
}
