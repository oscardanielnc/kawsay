/** @jest-environment node */
import catalog from '@kawsay/catalog/catalog.json';
import { loadCatalog } from '@/lib/db/catalog';
import { createTestDb } from '@/lib/db/test-db';
import type { Db, RecordEnv } from '@/lib/db/types';
import {
  addMeal,
  catalogItems,
  dayTotals,
  deleteMeal,
  drinksFromMeals,
  mealAt,
  mealsOn,
  recentFor,
} from './meals-db';

const lima = 'America/Lima';
const today = '2026-10-08';
const yesterday = '2026-10-07';
const tomorrow = '2026-10-09';

function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

async function seededDb(): Promise<Db> {
  const db = await createTestDb();
  await loadCatalog(db, catalog);
  return db;
}

describe('meal entries (F05)', () => {
  it('a dish portion scales its nutrients per serving', async () => {
    const db = await seededDb();
    const e = env();
    await addMeal(db, e, {
      date: today,
      meal: 'lunch',
      timeZone: lima,
      item: { kind: 'dish', id: 'lomo-saltado' },
      servings: 1,
    });
    await addMeal(db, e, {
      date: today,
      meal: 'lunch',
      timeZone: lima,
      item: { kind: 'dish', id: 'lomo-saltado' },
      servings: 0.5,
    });
    const [full, half] = await mealsOn(db, today);
    expect(full?.kcal).toBeGreaterThan(300);
    expect(half?.kcal).toBeCloseTo((full?.kcal ?? 0) / 2, 6);
    expect(half).toMatchObject({
      name: 'Lomo saltado',
      icon: 'plato',
      meal: 'lunch',
      servings: 0.5,
    });
  });

  it('grams instead of a portion use the nutrients per 100 g', async () => {
    const db = await seededDb();
    await addMeal(db, env(), {
      date: today,
      meal: 'lunch',
      timeZone: lima,
      item: { kind: 'food', id: 'arroz-cocido' },
      grams: 200,
    });
    expect((await mealsOn(db, today))[0]?.kcal).toBeCloseTo(230, 6); // INS A2: 115 kcal/100 g
  });

  it('a food portion uses its first household unit: 1 cup of cooked rice = 160 g', async () => {
    const db = await seededDb();
    await addMeal(db, env(), {
      date: today,
      meal: 'lunch',
      timeZone: lima,
      item: { kind: 'food', id: 'arroz-cocido' },
      servings: 1,
    });
    expect((await mealsOn(db, today))[0]).toMatchObject({ grams: 160 });
  });

  it('day totals add calories, protein, fat and carbohydrates', async () => {
    const db = await seededDb();
    const e = env();
    await addMeal(db, e, {
      date: today,
      meal: 'breakfast',
      timeZone: lima,
      item: { kind: 'food', id: 'arroz-cocido' },
      grams: 100,
    });
    await addMeal(db, e, {
      date: today,
      meal: 'dinner',
      timeZone: lima,
      item: { kind: 'food', id: 'arroz-cocido' },
      grams: 100,
    });
    const totals = dayTotals(await mealsOn(db, today));
    expect(totals.kcal).toBeCloseTo(230, 6);
    expect(totals.proteinG).toBeCloseTo(4.8, 6);
  });

  it('A personal Coca-Cola (500 ml) adds 55 g of added sugar to the day (F22)', async () => {
    const db = await seededDb();
    const e = env();
    await addMeal(db, e, {
      date: today,
      meal: 'lunch',
      timeZone: lima,
      item: { kind: 'food', id: 'coca-cola' },
      grams: 500,
    });
    await addMeal(db, e, {
      date: today,
      meal: 'snack',
      timeZone: lima,
      item: { kind: 'food', id: 'papaya' },
      grams: 200,
    });
    expect(dayTotals(await mealsOn(db, today)).addedSugarG).toBeCloseTo(55, 6);
  });

  it('removing an entry is a tombstone: it leaves the day', async () => {
    const db = await seededDb();
    const e = env();
    const { id } = await addMeal(db, e, {
      date: today,
      meal: 'lunch',
      timeZone: lima,
      item: { kind: 'dish', id: 'lomo-saltado' },
      servings: 1,
    });
    await deleteMeal(db, e, id);
    expect(await mealsOn(db, today)).toEqual([]);
  });

  it("repeating yesterday's breakfast: it is the first recent dish of today's breakfast (F05)", async () => {
    const db = await seededDb();
    await addMeal(db, env(), {
      date: yesterday,
      meal: 'breakfast',
      timeZone: lima,
      item: { kind: 'dish', id: 'pan-con-huevo' },
      servings: 1,
    });
    const recent = await recentFor(db, 'breakfast');
    expect(recent[0]).toMatchObject({ kind: 'dish', id: 'pan-con-huevo' });
    expect(recent).toHaveLength(12);
  });

  it('a new user still sees 12 dishes, the ones of that meal first', async () => {
    const db = await seededDb();
    const recent = await recentFor(db, 'breakfast');
    expect(recent).toHaveLength(12);
    expect(recent[0]?.group).toBe('breakfast');
  });

  it('half a dish at dinner with "save the rest" shows the other half in tomorrow\'s breakfast (F05)', async () => {
    const db = await seededDb();
    const { id } = await addMeal(db, env(), {
      date: today,
      meal: 'dinner',
      timeZone: lima,
      item: { kind: 'dish', id: 'mini-juane-pollo' },
      servings: 0.5,
      saveRestForTomorrow: true,
    });
    expect(await mealsOn(db, tomorrow)).toEqual([
      expect.objectContaining({
        meal: 'breakfast',
        servings: 0.5,
        name: 'Mini juane de pollo (calle)',
        leftoverOf: id,
      }),
    ]);
  });

  it('the rest is what was not eaten: ¼ at dinner leaves ¾ for breakfast (½ alone cannot tell them apart)', async () => {
    const db = await seededDb();
    await addMeal(db, env(), {
      date: today,
      meal: 'dinner',
      timeZone: lima,
      item: { kind: 'dish', id: 'mini-juane-pollo' },
      servings: 0.25,
      saveRestForTomorrow: true,
    });
    expect((await mealsOn(db, tomorrow))[0]?.servings).toBe(0.75);
  });

  it('a juice added to breakfast adds its calories there and counts as drink volume from breakfast (F05)', async () => {
    const db = await seededDb();
    await addMeal(db, env(), {
      date: today,
      meal: 'breakfast',
      timeZone: lima,
      item: { kind: 'food', id: 'naranja-jugo' },
      servings: 1,
    });
    expect((await mealsOn(db, today))[0]?.kcal).toBeCloseTo(112.5, 6); // USDA orange juice: 45 kcal/100 g × 250 g
    expect(await drinksFromMeals(db, today)).toEqual([
      { name: 'Naranja, jugo', meal: 'breakfast', volumeMl: 250 },
    ]);
  });

  it('solid food is not a drink', async () => {
    const db = await seededDb();
    await addMeal(db, env(), {
      date: today,
      meal: 'lunch',
      timeZone: lima,
      item: { kind: 'dish', id: 'lomo-saltado' },
      servings: 1,
    });
    expect(await drinksFromMeals(db, today)).toEqual([]);
  });

  it('lists every dish and food for search, with kcal per serving', async () => {
    const db = await seededDb();
    const items = await catalogItems(db);
    expect(items.filter((i) => i.kind === 'dish')).toHaveLength(101);
    expect(items.filter((i) => i.kind === 'food')).toHaveLength(147);
    expect(items.find((i) => i.id === 'arroz-cocido')).toMatchObject({
      source: 'INS',
      kcalPerServing: 184,
    });
  });
});

describe('mealAt: the meal a drink tapped in hydration goes to (F10)', () => {
  it.each([
    [7, 'breakfast'],
    [10, 'breakfast'],
    [11, 'lunch'],
    [15, 'lunch'],
    [16, 'snack'],
    [19, 'dinner'],
    [23, 'dinner'],
  ] as const)('%d h → %s', (hour, meal) => {
    expect(mealAt(hour)).toBe(meal);
  });
});
