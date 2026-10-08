import { describe, expect, it } from 'vitest';
import { dishTotals } from './dish-totals.ts';
import { emptyNutrients } from './nutrients.ts';
import type { ResolvedFood } from './resolve-food.ts';
import type { SeedDish } from './seed.ts';

function food(id: string, values: Partial<ResolvedFood['per100g']> | null): ResolvedFood {
  return {
    id,
    name: id,
    state: 'raw',
    units: [],
    source: { kind: 'INS' },
    per100g: values ? { ...emptyNutrients(), ...values } : null,
    status: values ? 'ok' : 'unmatched',
    notes: [],
  };
}

const foods = new Map([
  ['arroz', food('arroz', { energyKcal: 115, proteinG: 2.4, ironMg: 0.3 })],
  ['pollo', food('pollo', { energyKcal: 175, proteinG: 20, ironMg: null })],
  ['manjar', food('manjar', null)],
]);
const dish = (items: SeedDish['items']): SeedDish => ({
  id: 'd',
  name: 'Dish',
  group: 'main',
  icon: 'plato',
  confidence: 'medium',
  serving: '1 plato',
  servings: 1,
  items,
});

describe('dishTotals', () => {
  it('adds each ingredient by its grams', () => {
    const totals = dishTotals(
      dish([
        { food: 'arroz', grams: 200 },
        { food: 'pollo', grams: 100 },
      ]),
      foods,
    );
    expect(totals.grams).toBe(300);
    expect(totals.perServing.energyKcal).toBeCloseTo(2 * 115 + 175, 10);
    expect(totals.per100g.energyKcal).toBeCloseTo(((2 * 115 + 175) / 300) * 100, 10);
  });

  it('an unknown value is left out of the total and lowers its coverage (F06)', () => {
    const totals = dishTotals(
      dish([
        { food: 'arroz', grams: 200 },
        { food: 'pollo', grams: 100 },
      ]),
      foods,
    );
    expect(totals.perServing.ironMg).toBeCloseTo(0.6, 10);
    expect(totals.coverage.ironMg).toBeCloseTo(200 / 300, 10);
    expect(totals.coverage.energyKcal).toBe(1);
  });

  it('a nutrient nobody reports has a null total and zero coverage', () => {
    const totals = dishTotals(dish([{ food: 'arroz', grams: 100 }]), foods);
    expect(totals.perServing.zincMg).toBeNull();
    expect(totals.coverage.zincMg).toBe(0);
  });

  it('lists ingredients without source values', () => {
    const totals = dishTotals(
      dish([
        { food: 'arroz', grams: 100 },
        { food: 'manjar', grams: 20 },
      ]),
      foods,
    );
    expect(totals.missingFoods).toEqual(['manjar']);
    expect(totals.coverage.energyKcal).toBeCloseTo(100 / 120, 10);
  });

  it('divides by the number of servings the recipe makes', () => {
    const totals = dishTotals({ ...dish([{ food: 'arroz', grams: 400 }]), servings: 2 }, foods);
    expect(totals.perServing.energyKcal).toBeCloseTo(230, 10);
  });

  it('fails on an ingredient that is not in the catalog', () => {
    expect(() => dishTotals(dish([{ food: 'nope', grams: 10 }]), foods)).toThrow(/nope/);
  });
});
