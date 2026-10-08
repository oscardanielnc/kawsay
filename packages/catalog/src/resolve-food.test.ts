import { describe, expect, it } from 'vitest';
import { resolveFood, type Sources } from './resolve-food.ts';
import type { FoodMatch, SeedFood } from './seed.ts';

const insPapa = {
  code: 'U19',
  name: 'Papa blanca',
  energy_kcal: '87',
  water_g: '74.5',
  protein_g: '2.1',
  fat_g: '0.1',
  carbs_total_g: '19.5',
  carbs_available_g: '',
  fiber_g: '',
  iron_mg: '0.48',
};
const usdaEgg = {
  fdc_id: '171287',
  name: 'Egg, whole, raw, fresh',
  energy_kcal: '143',
  water_g: '76.15',
  protein_g: '12.56',
  vitamin_b12_ug: '0.89',
  vitamin_d_ug: '2',
};
const insEgg = { code: 'J4', name: 'Huevo de gallina entero, crudo', energy_kcal: '166' };
const sources: Sources = {
  ins: new Map([
    ['U19', insPapa],
    ['J4', insEgg],
  ]),
  usda: new Map([['171287', usdaEgg]]),
};
const food = (overrides: Partial<SeedFood> = {}): SeedFood => ({
  name: 'Papa blanca sancochada',
  source: 'INS',
  state: 'cooked',
  units: [{ label: '1 papa mediana', grams: 150 }],
  ...overrides,
});

describe('resolveFood', () => {
  it('takes an INS row as it is', () => {
    const resolved = resolveFood('papa', food({ state: 'raw' }), { ins: 'U19' }, sources);
    expect(resolved.status).toBe('ok');
    expect(resolved.source).toEqual({ kind: 'INS', code: 'U19', name: 'Papa blanca' });
    expect(resolved.per100g?.energyKcal).toBe(87);
    expect(resolved.per100g?.ironMg).toBe(0.48);
  });

  it('a missing value stays null, never zero', () => {
    const resolved = resolveFood('papa', food(), { ins: 'U19' }, sources);
    expect(resolved.per100g?.fiberG).toBeNull();
    expect(resolved.per100g?.zincMg).toBeNull();
  });

  it('converts a raw row to cooked with the cooked-to-raw factor: nutrients × factor, water from dry matter', () => {
    const match: FoodMatch = {
      ins: 'U19',
      cookedToRaw: { factor: 1.02, ref: 'TAFERA 2016, table II: Papa, sancochado' },
    };
    const per100g = resolveFood('papa', food(), match, sources).per100g;
    expect(per100g?.energyKcal).toBeCloseTo(87 * 1.02, 10);
    expect(per100g?.proteinG).toBeCloseTo(2.1 * 1.02, 10);
    expect(per100g?.waterG).toBeCloseTo(100 - 25.5 * 1.02, 10);
  });

  it('fills B12 and vitamin D from the linked USDA food, and says so', () => {
    const resolved = resolveFood('huevo', food(), { ins: 'J4', fill: 171287 }, sources);
    expect(resolved.per100g?.vitaminB12Ug).toBe(0.89);
    expect(resolved.per100g?.vitaminDUg).toBe(2);
    expect(resolved.filledFrom).toEqual({
      fdcId: 171287,
      nutrients: ['vitaminB12Ug', 'vitaminDUg'],
    });
  });

  it('plant foods have no B12 or vitamin D', () => {
    const per100g = resolveFood('papa', food(), { ins: 'U19', plant: true }, sources).per100g;
    expect(per100g?.vitaminB12Ug).toBe(0);
    expect(per100g?.vitaminDUg).toBe(0);
  });

  it('without a fill or plant flag, B12 and vitamin D stay unknown', () => {
    expect(resolveFood('papa', food(), { ins: 'U19' }, sources).per100g?.vitaminB12Ug).toBeNull();
  });

  it('takes a USDA food as it is', () => {
    const resolved = resolveFood('huevo', food(), { usda: 171287 }, sources);
    expect(resolved.source).toEqual({
      kind: 'USDA',
      code: '171287',
      name: 'Egg, whole, raw, fresh',
    });
    expect(resolved.per100g?.energyKcal).toBe(143);
  });

  it('marks a proxy match so the report lists it', () => {
    const resolved = resolveFood('x', food(), { ins: 'U19', proxy: 'closest row' }, sources);
    expect(resolved.status).toBe('proxy');
    expect(resolved.notes).toContain('Proxy: closest row');
  });

  it('turns a label read per serving into values per 100 g', () => {
    const resolved = resolveFood(
      'oreo',
      food({
        source: 'label',
        label: {
          servingGrams: 36,
          kcal: 170,
          carbs: 25,
          fat: 7,
          protein: 2,
          sodiumMg: 160,
          from: 'pack',
        },
      }),
      { label: true },
      sources,
    );
    expect(resolved.status).toBe('ok');
    expect(resolved.per100g?.energyKcal).toBeCloseTo((170 / 36) * 100, 10);
    expect(resolved.per100g?.sodiumMg).toBeCloseTo((160 / 36) * 100, 10);
    expect(resolved.per100g?.ironMg).toBeNull();
  });

  it('a label without its serving size waits to be read', () => {
    const pending = resolveFood('tari', food({ source: 'label' }), { label: true }, sources);
    expect(pending).toMatchObject({ status: 'label-pending', per100g: null });
  });

  it('water has no nutrients', () => {
    const water = resolveFood('agua', food({ source: 'none' }), { none: true }, sources).per100g;
    expect(water?.energyKcal).toBe(0);
    expect(water?.waterG).toBe(100);
  });

  it('an unmatched food has no values and keeps the reason', () => {
    const resolved = resolveFood('manjar', food(), { unmatched: 'not in INS nor USDA' }, sources);
    expect(resolved).toMatchObject({
      status: 'unmatched',
      per100g: null,
      notes: ['not in INS nor USDA'],
    });
  });

  it('fails on a code that does not exist: a broken link is a bug, not missing data', () => {
    expect(() => resolveFood('x', food(), { ins: 'Z99' }, sources)).toThrow(/Z99/);
    expect(() => resolveFood('x', food(), { usda: 1 }, sources)).toThrow(/1/);
  });
});
