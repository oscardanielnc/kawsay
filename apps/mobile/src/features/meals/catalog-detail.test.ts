/** @jest-environment node */
import catalog from '@kawsay/catalog/catalog.json';
import { loadCatalog } from '@/lib/db/catalog';
import { createTestDb } from '@/lib/db/test-db';
import type { Db } from '@/lib/db/types';
import { itemDetail } from './catalog-detail';
import { catalogItems } from './meals-db';
import { searchCatalog } from './search';

async function seededDb(): Promise<Db> {
  const db = await createTestDb();
  await loadCatalog(db, catalog);
  return db;
}

describe('catalog search and detail on the real catalog (F06)', () => {
  it('Searching "plátano" returns Peruvian entries first, offline', async () => {
    const results = searchCatalog('plátano', await catalogItems(await seededDb()));
    expect(results.length).toBeGreaterThan(1);
    const firstForeign = results.findIndex((r) => r.source !== 'dish' && r.source !== 'INS');
    const peruvian = firstForeign === -1 ? results : results.slice(0, firstForeign);
    expect(peruvian.length).toBeGreaterThan(0);
    expect(
      results.slice(peruvian.length).every((r) => r.source !== 'dish' && r.source !== 'INS'),
    ).toBe(true);
  });

  it('"juane" returns the seed dish with its ingredients and sources', async () => {
    const db = await seededDb();
    const juane = searchCatalog('juane', await catalogItems(db)).find(
      (r) => r.id === 'juane-gallina',
    );
    expect(juane).toBeDefined();
    const detail = await itemDetail(db, { kind: 'dish', id: 'juane-gallina' });
    expect(detail.source).toEqual({ kind: 'dish', code: null });
    expect(detail.ingredients).toContainEqual({
      name: expect.stringMatching(/arroz/i) as string,
      grams: 250,
      source: { kind: 'INS', code: 'A2' },
    });
    expect(detail.ingredients).toHaveLength(9);
    expect(detail.perServing.energyKcal).toBeGreaterThan(500);
  });

  it('A food without an iron value shows "sin dato" and is left out of the iron coverage', async () => {
    const db = await seededDb();
    const mayo = await itemDetail(db, { kind: 'food', id: 'mayonesa' });
    expect(mayo.perServing.ironMg).toBeNull();
    expect(mayo.coverage.ironMg).toBe(0);
    expect(mayo.source).toEqual({ kind: 'label', code: null });

    const dish = await itemDetail(db, { kind: 'dish', id: 'papa-huancaina' });
    expect(dish.coverage.ironMg).toBeGreaterThan(0);
    expect(dish.coverage.ironMg).toBeLessThan(1);
    expect(dish.coverage.energyKcal).toBe(1);
  });
});
