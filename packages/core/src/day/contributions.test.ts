import { describe, expect, it } from 'vitest';
import { contributions, type ContributionEntry } from './contributions';

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

const entry = (
  e: Partial<ContributionEntry> & Pick<ContributionEntry, 'itemId' | 'meal'>,
): ContributionEntry => ({
  kind: 'dish',
  name: e.itemId,
  icon: '🍽️',
  servings: 1,
  grams: null,
  kcal: 0,
  proteinG: 0,
  fatG: 0,
  carbsG: 0,
  addedSugarG: 0,
  refinedFlourG: 0,
  ...e,
});

/** An invented day. */
const DAY: ContributionEntry[] = [
  entry({
    itemId: 'pan',
    kind: 'food',
    meal: 'breakfast',
    servings: 2,
    kcal: 280,
    carbsG: 56,
    refinedFlourG: 56,
    addedSugarG: 2,
  }),
  entry({
    itemId: 'pollo-brasa',
    name: 'Pollo a la brasa',
    meal: 'lunch',
    servings: 0.25,
    kcal: 878,
    proteinG: 52,
  }),
  entry({
    itemId: 'inca-kola',
    name: 'Inca Kola',
    kind: 'food',
    meal: 'lunch',
    grams: 500,
    servings: null,
    kcal: 220,
    addedSugarG: 55,
  }),
  entry({
    itemId: 'inca-kola',
    name: 'Inca Kola',
    kind: 'food',
    meal: 'dinner',
    grams: 300,
    servings: null,
    kcal: 132,
    addedSugarG: 33,
  }),
  entry({ itemId: 'palta', kind: 'food', meal: 'breakfast', servings: 0.5, kcal: 120 }),
];

describe('contributions: what added most to a gauge (F26)', () => {
  it('Pollo a la brasa, 878 kcal at lunch, is the first calories row with its share of the day', () => {
    const { rows, total } = contributions(DAY, 'kcal', MEAL_ORDER);
    expect(total).toBe(1630);
    expect(rows[0]).toMatchObject({ name: 'Pollo a la brasa', meals: ['lunch'], amount: 878 });
    expect(rows[0]!.share).toBeCloseTo(878 / 1630);
    expect(rows.map((r) => r.amount)).toEqual([878, 352, 280, 120]);
  });

  it('an Inca Kola at lunch and another at dinner are one row with the sum and "Almuerzo y cena"', () => {
    const kola = contributions(DAY, 'kcal', MEAL_ORDER).rows.find((r) => r.name === 'Inca Kola')!;
    expect(kola.amount).toBe(352);
    expect(kola.meals).toEqual(['lunch', 'dinner']);
    expect(kola.portions).toEqual([
      { servings: null, grams: 500 },
      { servings: null, grams: 300 },
    ]);
  });

  it('switching to added sugar reorders by grams and leaves out foods without it', () => {
    const { rows, omitted } = contributions(DAY, 'addedSugarG', MEAL_ORDER);
    expect(rows.map((r) => [r.name, r.amount])).toEqual([
      ['Inca Kola', 88],
      ['pan', 2],
    ]);
    expect(omitted).toBe(2);
  });

  it('a food and a dish with the same id stay apart', () => {
    const rows = contributions(
      [
        entry({ itemId: 'x', kind: 'food', meal: 'lunch', kcal: 10 }),
        entry({ itemId: 'x', kind: 'dish', meal: 'lunch', kcal: 20 }),
      ],
      'kcal',
      MEAL_ORDER,
    ).rows;
    expect(rows).toHaveLength(2);
  });

  it('meals follow the day order whatever the order of the entries', () => {
    const rows = contributions(
      [
        entry({ itemId: 'te', meal: 'dinner', kcal: 5 }),
        entry({ itemId: 'te', meal: 'breakfast', kcal: 5 }),
      ],
      'kcal',
      MEAL_ORDER,
    ).rows;
    expect(rows[0]!.meals).toEqual(['breakfast', 'dinner']);
  });

  it('an empty day has no rows and a zero total', () => {
    expect(contributions([], 'kcal', MEAL_ORDER)).toEqual({ rows: [], total: 0, omitted: 0 });
  });
});
