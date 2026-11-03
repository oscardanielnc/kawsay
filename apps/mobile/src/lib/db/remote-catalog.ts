import type { CatalogDishesResponse, RemoteDish } from '@kawsay/contracts/catalog';
import { eq, inArray } from 'drizzle-orm';
import { dish, dishItem, food, meta } from './schema';
import { inTransaction } from './transaction';
import type { Db } from './types';

const VERSION_KEY = 'remoteCatalogVersion';

/** The remote catalog version this phone holds; null before the first pull or after the bundle reloaded. */
export async function remoteCatalogVersion(db: Db): Promise<string | null> {
  const [row] = await db.select().from(meta).where(eq(meta.key, VERSION_KEY));
  return row?.value ?? null;
}

/** Forgets the remote version, so the next pull brings every dish again (the bundle reload wiped them). */
export async function forgetRemoteCatalog(db: Db): Promise<void> {
  await db.delete(meta).where(eq(meta.key, VERSION_KEY));
}

/**
 * Applies a catalog pull (F23 piece 5, ADR 0028): estimated dishes the list no longer has are removed, new and
 * changed ones are written with their ingredients. A dish whose ingredient this phone does not have yet waits for
 * the next app update. Returns how many dishes the phone holds from the remote catalog.
 */
export async function applyRemoteCatalog(
  db: Db,
  response: CatalogDishesResponse,
): Promise<{ kept: number; skipped: number } | 'up-to-date'> {
  if ('upToDate' in response) return 'up-to-date';
  const known = new Set((await db.select({ id: food.id }).from(food)).map((f) => f.id));
  const usable = response.dishes.filter((d) => d.items.every((i) => known.has(i.food)));
  const bundled = new Set(
    (await db.select({ id: dish.id, source: dish.source }).from(dish))
      .filter((d) => d.source !== 'estimated')
      .map((d) => d.id),
  );
  const rows = usable.filter((d) => !bundled.has(d.id));
  await inTransaction(db, async () => {
    const old = (
      await db.select({ id: dish.id }).from(dish).where(eq(dish.source, 'estimated'))
    ).map((d) => d.id);
    if (old.length) {
      await db.delete(dishItem).where(inArray(dishItem.dishId, old));
      await db.delete(dish).where(inArray(dish.id, old));
    }
    for (const d of rows) await insertDish(db, d, response.version);
    await db
      .insert(meta)
      .values({ key: VERSION_KEY, value: response.version })
      .onConflictDoUpdate({ target: meta.key, set: { value: response.version } });
  });
  return { kept: rows.length, skipped: response.dishes.length - rows.length };
}

async function insertDish(db: Db, d: RemoteDish, version: string): Promise<void> {
  await db.insert(dish).values({
    id: d.id,
    name: d.name,
    group: d.group,
    icon: d.icon,
    serving: d.serving,
    servings: d.servings,
    servingGrams: d.totals.grams,
    perServing: d.totals.perServing,
    per100g: d.totals.per100g,
    tags: d.tags,
    source: 'estimated',
    sourceCode: null,
    remoteVersion: version,
  });
  await db.insert(dishItem).values(
    d.items.map((item, position) => ({
      dishId: d.id,
      foodId: item.food,
      grams: item.grams,
      position,
    })),
  );
}
