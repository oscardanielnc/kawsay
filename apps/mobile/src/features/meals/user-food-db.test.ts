/** @jest-environment node */
import catalog from '@kawsay/catalog/catalog.json';
import type { LocalDate } from '@kawsay/core/shared/local-date';
import { eq } from 'drizzle-orm';
import { loadCatalog } from '@/lib/db/catalog';
import { syncOutbox } from '@/lib/db/schema';
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { itemDetail } from './catalog-detail';
import { addMeal, catalogItems, foodUnits, mealsOn, saveUserDish } from './meals-db';
import { deleteUserFood, saveUserFood, type NewUserFood } from './user-food-db';

function env(): RecordEnv {
  let now = Date.UTC(2026, 10, 12, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

const DAY = '2026-11-12' as LocalDate;
/** Invented vanilla cookies: 150 kcal per serving of 30 g → 500 kcal per 100 g. */
const COOKIES: NewUserFood = {
  name: 'Galletas de vainilla',
  brand: 'Marca X',
  label: {
    basis: 'perServing',
    servingGrams: 30,
    values: {
      energyKcal: 150,
      proteinG: 1.8,
      fatG: 6,
      carbsTotalG: 22,
      fiberG: 0.5,
      sugarsTotalG: 9,
    },
    refinedFlour: true,
  },
  servingLabel: '6 galletas',
  packageGrams: 180,
  isDrink: false,
  readByAi: true,
  labelDate: DAY,
};

describe('label foods (F23 piece 3)', () => {
  it('a label food shows "Label" as its source and its date', async () => {
    const db = await createTestDb();
    await loadCatalog(db, catalog);
    const { id } = await saveUserFood(db, env(), COOKIES);
    const detail = await itemDetail(db, { kind: 'food', id });
    expect(detail.source).toEqual({ kind: 'label', code: DAY });
    expect(detail.servingGrams).toBe(30);
    expect(detail.perServing.energyKcal).toBeCloseTo(150);
  });

  it('is offered with its serving and package units, and logging one serving adds its numbers', async () => {
    const db = await createTestDb();
    await loadCatalog(db, catalog);
    const e = env();
    const { id } = await saveUserFood(db, e, COOKIES);
    const item = (await catalogItems(db)).find((i) => i.id === id);
    expect(item).toMatchObject({
      kind: 'food',
      name: 'Galletas de vainilla (Marca X)',
      source: 'user-label',
      servingGrams: 30,
      tags: ['refined-flour'],
    });
    expect(item?.kcalPerServing).toBeCloseTo(150);
    expect((await foodUnits(db))[id]).toEqual([
      { label: '6 galletas (30 g)', grams: 30 },
      { label: '1 envase (180 g)', grams: 180 },
    ]);

    await addMeal(db, e, {
      date: DAY,
      meal: 'snack',
      timeZone: 'America/Lima',
      item: { kind: 'food', id },
      servings: 1,
    });
    const [entry] = await mealsOn(db, DAY);
    expect(entry?.kcal).toBeCloseTo(150);
    // Refined flour (F24): available carbohydrate 21.5 g per serving.
    expect(entry?.refinedFlourG).toBeCloseTo(21.5);
  });

  it('works as an ingredient of an own dish', async () => {
    const db = await createTestDb();
    await loadCatalog(db, catalog);
    const e = env();
    const { id } = await saveUserFood(db, e, COOKIES);
    const dish = await saveUserDish(db, e, {
      name: 'Postre de galleta',
      icon: 'dulce',
      servings: 1,
      items: [{ foodId: id, grams: 60, unitLabel: null, unitCount: null }],
    });
    const item = (await catalogItems(db)).find((i) => i.id === dish.id);
    expect(item?.kcalPerServing).toBeCloseTo(300);
    const detail = await itemDetail(db, { kind: 'dish', id: dish.id });
    expect(detail.ingredients[0]).toMatchObject({
      name: 'Galletas de vainilla',
      source: { kind: 'label', code: DAY },
    });
  });

  it('syncs (ADR 0018) and a deleted label food leaves the list', async () => {
    const db = await createTestDb();
    await loadCatalog(db, catalog);
    const e = env();
    const { id } = await saveUserFood(db, e, COOKIES);
    const queued = await db.select().from(syncOutbox).where(eq(syncOutbox.recordId, id));
    expect(queued.map((q) => q.collection)).toEqual(['user_food']);
    await deleteUserFood(db, e, id);
    expect((await catalogItems(db)).some((i) => i.id === id)).toBe(false);
  });

  it('needs a name and its energy', async () => {
    const db = await createTestDb();
    await expect(saveUserFood(db, env(), { ...COOKIES, name: ' ' })).rejects.toThrow(/name/);
    await expect(
      saveUserFood(db, env(), {
        ...COOKIES,
        label: { ...COOKIES.label, values: { ...COOKIES.label.values, energyKcal: null } },
      }),
    ).rejects.toThrow(/energy/);
  });
});
