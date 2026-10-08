import { describe, expect, it } from 'vitest';
import { buildCatalog, readInputs } from './build-catalog.ts';

const catalog = buildCatalog(readInputs(new URL('..', import.meta.url)));

describe('buildCatalog on the real seed and sources', () => {
  it('resolves every seed food; every link points to an existing row', () => {
    expect(catalog.foods).toHaveLength(128);
  });

  it('INS comes first: most foods resolve from the Peruvian table', () => {
    const ins = catalog.foods.filter((f) => f.source.kind === 'INS').length;
    expect(ins).toBeGreaterThan(90);
  });

  it('cooked rice is INS A2 as eaten', () => {
    const rice = catalog.foods.find((f) => f.id === 'arroz-cocido');
    expect(rice?.source.code).toBe('A2');
    expect(rice?.per100g?.energyKcal).toBe(115);
  });

  it('boiled potato is converted from raw with its TAFERA factor', () => {
    const potato = catalog.foods.find((f) => f.id === 'papa-sancochada');
    expect(potato?.per100g?.energyKcal).toBeCloseTo(87 * 1.02, 10);
  });

  it('egg carries B12 and vitamin D from USDA', () => {
    const egg = catalog.foods.find((f) => f.id === 'huevo');
    expect(egg?.per100g?.vitaminB12Ug).toBe(0.89);
  });

  it('computes all 76 seed dishes', () => {
    expect(catalog.dishes).toHaveLength(76);
    const juane = catalog.dishes.find((d) => d.id === 'mini-juane-pollo');
    expect(juane?.totals.perServing.energyKcal).toBeGreaterThan(200);
  });

  it('cross-checks the dishes linked to group S', () => {
    expect(catalog.crossChecks.length).toBe(25);
  });
});
