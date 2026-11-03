/** @jest-environment node */
import catalog from '@kawsay/catalog/catalog.json';
import type { RemoteDish } from '@kawsay/contracts/catalog';
import { eq } from 'drizzle-orm';
import { itemDetail } from '@/features/meals/catalog-detail';
import { catalogItems } from '@/features/meals/meals-db';
import { searchCatalog } from '@/features/meals/search';
import { LOADER_VERSION, loadCatalog, type BundledCatalog } from './catalog';
import { applyRemoteCatalog, remoteCatalogVersion } from './remote-catalog';
import { dish, dishItem, meta } from './schema';
import { createTestDb } from './test-db';

const bundled = catalog as unknown as BundledCatalog;

/** An invented dish published on the API. */
const tortaHelada: RemoteDish = {
  id: 'est-torta-helada',
  name: 'Torta helada',
  aliases: ['Gelatina con torta'],
  group: 'sweet',
  icon: 'dulce',
  serving: '1 tajada',
  servings: 10,
  source: 'estimated',
  items: [
    { food: 'huevo', grams: 200 },
    { food: 'azucar', grams: 250 },
    { food: 'harina-trigo', grams: 150 },
  ],
  tags: ['refined-flour'],
  totals: {
    grams: 60,
    perServing: { energyKcal: 220, proteinG: 3 },
    per100g: { energyKcal: 366, proteinG: 5 },
  },
};

async function seeded() {
  const db = await createTestDb();
  await loadCatalog(db, bundled);
  return db;
}

describe('catalog by sync (F23 piece 5, ADR 0028)', () => {
  it('a dish published on the API reaches the phone without an app update', async () => {
    const db = await seeded();
    await applyRemoteCatalog(db, {
      version: 'r1',
      bundledVersion: bundled.version,
      dishes: [tortaHelada],
    });
    const found = searchCatalog('torta helada', await catalogItems(db));
    expect(found[0]).toMatchObject({ id: 'est-torta-helada', source: 'estimated' });
    expect(await remoteCatalogVersion(db)).toBe('r1');
    const detail = await itemDetail(db, { kind: 'dish', id: 'est-torta-helada' });
    expect(detail.source.kind).toBe('estimated');
    expect(detail.ingredients.map((i) => i.name)).toHaveLength(3);
  });

  it('"up to date" changes nothing; a newer list replaces the old dishes', async () => {
    const db = await seeded();
    await applyRemoteCatalog(db, { version: 'r1', bundledVersion: 'b', dishes: [tortaHelada] });
    expect(await applyRemoteCatalog(db, { version: 'r1', upToDate: true })).toBe('up-to-date');
    const renamed = { ...tortaHelada, id: 'est-torta-helada-fresa', name: 'Torta helada de fresa' };
    await applyRemoteCatalog(db, { version: 'r2', bundledVersion: 'b', dishes: [renamed] });
    const rows = await db.select().from(dish).where(eq(dish.source, 'estimated'));
    expect(rows.map((r) => r.id)).toEqual(['est-torta-helada-fresa']);
    expect(await db.select().from(dishItem).where(eq(dishItem.dishId, 'est-torta-helada'))).toEqual(
      [],
    );
  });

  it('a dish with an ingredient this phone does not have waits for the next update', async () => {
    const db = await seeded();
    const result = await applyRemoteCatalog(db, {
      version: 'r1',
      bundledVersion: 'b',
      dishes: [{ ...tortaHelada, items: [{ food: 'not-yet', grams: 10 }] }],
    });
    expect(result).toEqual({ kept: 0, skipped: 1 });
  });

  it('a new bundled catalog wipes the synced dishes and forgets their version, so the next pull refills them', async () => {
    const db = await seeded();
    await applyRemoteCatalog(db, { version: 'r1', bundledVersion: 'b', dishes: [tortaHelada] });
    await db.update(meta).set({ value: 'old' }).where(eq(meta.key, 'catalogLoader'));
    expect(LOADER_VERSION).not.toBe('old');
    await loadCatalog(db, bundled);
    expect(await remoteCatalogVersion(db)).toBeNull();
    expect(await db.select().from(dish).where(eq(dish.source, 'estimated'))).toEqual([]);
  });
});
