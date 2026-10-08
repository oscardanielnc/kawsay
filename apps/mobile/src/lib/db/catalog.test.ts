/** @jest-environment node */
import catalog from '@kawsay/catalog/catalog.json';
import { count, eq } from 'drizzle-orm';
import { loadCatalog, type BundledCatalog } from './catalog';
import { dish, dishItem, food, foodUnit, meta } from './schema';
import { createTestDb } from './test-db';

const bundled = catalog as unknown as BundledCatalog;

describe('loadCatalog', () => {
  it('loads every seed food with its units and every seed dish with its items', async () => {
    const db = await createTestDb();
    expect(await loadCatalog(db, bundled)).toBe('loaded');
    expect((await db.select({ n: count() }).from(food))[0]?.n).toBe(128);
    expect((await db.select({ n: count() }).from(dish))[0]?.n).toBe(77);
    const rice = await db.select().from(food).where(eq(food.id, 'arroz-cocido'));
    expect(rice[0]).toMatchObject({ sourceKind: 'INS', sourceCode: 'A2' });
    expect(rice[0]?.per100g?.energyKcal).toBe(115);
    expect(
      (await db.select().from(foodUnit).where(eq(foodUnit.foodId, 'arroz-cocido')))[0],
    ).toMatchObject({
      label: '1 taza',
      grams: 160,
    });
    expect(
      (
        await db
          .select({ n: count() })
          .from(dishItem)
          .where(eq(dishItem.dishId, 'caldo-pollo-menu'))
      )[0]?.n,
    ).toBe(8);
  });

  it('does nothing when the same version is already loaded', async () => {
    const db = await createTestDb();
    await loadCatalog(db, bundled);
    expect(await loadCatalog(db, bundled)).toBe('up-to-date');
    expect((await db.select({ n: count() }).from(food))[0]?.n).toBe(128);
  });

  it('replaces the catalog when the version changes', async () => {
    const db = await createTestDb();
    await loadCatalog(db, bundled);
    const smaller: BundledCatalog = {
      ...bundled,
      version: 'next',
      foods: bundled.foods.slice(0, 3),
      dishes: [],
    };
    expect(await loadCatalog(db, smaller)).toBe('loaded');
    expect((await db.select({ n: count() }).from(food))[0]?.n).toBe(3);
    expect((await db.select({ n: count() }).from(dish))[0]?.n).toBe(0);
    expect((await db.select().from(meta).where(eq(meta.key, 'catalogVersion')))[0]?.value).toBe(
      'next',
    );
  });

  it('a load that fails halfway leaves the previous catalog untouched', async () => {
    const db = await createTestDb();
    await loadCatalog(db, bundled);
    const first = bundled.foods[0]!;
    const broken: BundledCatalog = { ...bundled, version: 'broken', foods: [first, first] };
    await expect(loadCatalog(db, broken)).rejects.toThrow();
    expect((await db.select({ n: count() }).from(food))[0]?.n).toBe(128);
    expect((await db.select({ n: count() }).from(dish))[0]?.n).toBe(77);
    expect((await db.select().from(meta).where(eq(meta.key, 'catalogVersion')))[0]?.value).toBe(
      bundled.version,
    );
  });

  it('stores each dish with its serving weight and nutrients per serving', async () => {
    const db = await createTestDb();
    await loadCatalog(db, bundled);
    const [broth] = await db.select().from(dish).where(eq(dish.id, 'caldo-pollo-menu'));
    expect(broth?.servingGrams).toBe(565);
    expect(broth?.perServing?.energyKcal).toBeGreaterThan(200);
    expect(broth?.per100g?.energyKcal).toBeCloseTo((broth?.perServing?.energyKcal ?? 0) / 5.65, 6);
  });

  it('reloads when the loader changes, even if the catalog data did not', async () => {
    const db = await createTestDb();
    await db.insert(meta).values({ key: 'catalogVersion', value: bundled.version });
    expect(await loadCatalog(db, bundled)).toBe('loaded');
  });
});
