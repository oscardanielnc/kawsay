import { describe, expect, it } from 'vitest';
import { buildCatalog, readInputs } from './build-catalog.ts';

const inputs = readInputs(new URL('..', import.meta.url));
const catalog = buildCatalog(inputs);
const food = (id: string) => catalog.foods.find((f) => f.id === id);
const dish = (id: string) => catalog.dishes.find((d) => d.id === id);

describe('added sugar in the catalog (F22)', () => {
  it('A personal Coca-Cola (500 ml) adds 55 g of added sugar', () => {
    expect(((food('coca-cola')?.per100g?.addedSugarG ?? 0) * 500) / 100).toBeCloseTo(55, 10);
  });

  it('A papaya or a glass of milk adds no added sugar', () => {
    expect(food('papaya')?.per100g?.addedSugarG).toBe(0);
    expect(food('leche-entera')?.per100g?.addedSugarG).toBe(0);
  });

  it('a label without added sugars uses its total sugars; one that prints them uses those', () => {
    expect(food('oreo')?.per100g?.addedSugarG).toBeCloseTo((14 / 36) * 100, 10);
    expect(food('yogurt-griego')?.per100g?.addedSugarG).toBe(0);
  });

  it('dishes add up their ingredients: a glass of lemonade has its 20 g of sugar', () => {
    expect(dish('refresco-limon')?.totals.perServing.addedSugarG).toBeCloseTo(20, 10);
  });

  it('Every packaged or prepared food of the catalog has an explicit added-sugar value', () => {
    const missing = Object.entries(inputs.foods)
      .filter(([, f]) => f.state === 'as-sold' && f.source !== 'label')
      .map(([id]) => id)
      .filter((id) => !(id in inputs.addedSugar));
    expect(missing).toEqual([]);
  });

  it('every food ends with a number, never unknown', () => {
    expect(catalog.foods.filter((f) => f.per100g && f.per100g.addedSugarG === null)).toEqual([]);
  });
});
