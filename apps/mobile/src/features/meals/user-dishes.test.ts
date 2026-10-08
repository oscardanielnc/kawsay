/** @jest-environment node */
import catalog from '@kawsay/catalog/catalog.json';
import { loadCatalog } from '@/lib/db/catalog';
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { addMeal, catalogItems, foodUnits, mealsOn, saveUserDish } from './meals-db';

function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

describe('user dishes (F07)', () => {
  it('a dish built from catalog foods is listed first, with nutrients computed from the catalog', async () => {
    const db = await createTestDb();
    await loadCatalog(db, catalog);
    const e = env();
    const units = await foodUnits(db);
    const eighth = units['pollo-carne']?.find((u) => u.label === '1/8 de pollo');
    const rice = units['arroz-cocido']?.find((u) => u.label === '1 taza');
    expect(eighth && rice).toBeTruthy();
    const { id } = await saveUserDish(db, e, {
      name: 'Arroz con pollo de la casa',
      icon: 'arroz',
      servings: 2,
      items: [
        {
          foodId: 'pollo-carne',
          grams: (eighth?.grams ?? 0) * 2,
          unitLabel: '1/8 de pollo',
          unitCount: 2,
        },
        {
          foodId: 'arroz-cocido',
          grams: (rice?.grams ?? 0) * 2,
          unitLabel: '1 taza',
          unitCount: 2,
        },
      ],
    });
    const [first] = await catalogItems(db);
    expect(first).toMatchObject({ kind: 'dish', id, source: 'user', icon: 'arroz' });
    expect(first?.servingGrams).toBeCloseTo((eighth?.grams ?? 0) + (rice?.grams ?? 0));
    expect(first?.kcalPerServing).toBeGreaterThan(0);
  });

  it('a saved dish is logged like any other, with portion 1', async () => {
    const db = await createTestDb();
    await loadCatalog(db, catalog);
    const e = env();
    const { id } = await saveUserDish(db, e, {
      name: 'Batido',
      icon: 'jugo',
      servings: 1,
      items: [{ foodId: 'huevo', grams: 50, unitLabel: '1 huevo', unitCount: 1 }],
    });
    await addMeal(db, e, {
      date: '2026-10-08',
      meal: 'breakfast',
      timeZone: 'America/Lima',
      item: { kind: 'dish', id },
      servings: 1,
    });
    const [entry] = await mealsOn(db, '2026-10-08');
    expect(entry).toMatchObject({ name: 'Batido', servings: 1, grams: 50 });
    expect(entry?.kcal).toBeGreaterThan(0);
  });

  it('a dish needs a name and an ingredient', async () => {
    const db = await createTestDb();
    await expect(
      saveUserDish(db, env(), { name: ' ', icon: 'plato', servings: 1, items: [] }),
    ).rejects.toThrow();
  });
});
