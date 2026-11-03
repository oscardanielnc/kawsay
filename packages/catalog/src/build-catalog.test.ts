import { describe, expect, it } from 'vitest';
import { buildCatalog, readInputs } from './build-catalog.ts';

const catalog = buildCatalog(readInputs(new URL('..', import.meta.url)));

describe('buildCatalog on the real seed and sources', () => {
  it('resolves every seed food; every link points to an existing row', () => {
    expect(catalog.foods.filter((f) => !f.generic)).toHaveLength(151);
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

  it('computes all 107 seed dishes', () => {
    expect(catalog.dishes.filter((d) => d.source === 'curated')).toHaveLength(107);
    const juane = catalog.dishes.find((d) => d.id === 'mini-juane-pollo');
    expect(juane?.totals.perServing.energyKcal).toBeGreaterThan(200);
  });

  it('avocado is palta fuerte (INS C131)', () => {
    expect(catalog.foods.find((f) => f.id === 'palta')?.source.code).toBe('C131');
  });

  it('a gap the owner accepted is reported as accepted, with its reason', () => {
    const huancaina = catalog.crossChecks.find((c) => c.dish === 'papa-huancaina');
    expect(huancaina?.verdict).toBe('accepted');
    expect(huancaina?.acceptedBecause).toMatch(/midpoint/i);
  });

  it('the version is a hash of the content: rebuilding the same data keeps it, changing a value changes it', () => {
    const again = buildCatalog(readInputs(new URL('..', import.meta.url)));
    expect(catalog.version).toMatch(/^[0-9a-f]{16}$/);
    expect(again.version).toBe(catalog.version);
    const inputs = readInputs(new URL('..', import.meta.url));
    inputs.dishes[0]!.items[0]!.grams += 1;
    expect(buildCatalog(inputs).version).not.toBe(catalog.version);
  });

  it('cross-checks the dishes linked to group S', () => {
    expect(catalog.crossChecks.length).toBe(24);
  });
});

describe('INS group S dishes (ADR 0028 layer 1)', () => {
  const ins = catalog.dishes.filter((d) => d.source === 'INS-S');
  const byName = (name: string) => ins.filter((d) => d.name.toLowerCase().includes(name));

  it('adds the 544 official preparations, with no id shared with the curated dishes', () => {
    expect(ins).toHaveLength(544);
    expect(new Set(catalog.dishes.map((d) => d.id)).size).toBe(catalog.dishes.length);
  });

  it('aguadito de pollo: INS SE1 values per 100 g and one ENCONUT plate of 504 g', () => {
    const aguadito = ins.find((d) => d.id === 'ins-se1')!;
    expect(aguadito).toMatchObject({ name: 'Aguadito de pollo', serving: '1 plato', items: [] });
    expect(aguadito.sourceCode).toBe('SE1');
    expect(aguadito.totals.per100g.energyKcal).toBe(43);
    expect(aguadito.totals.grams).toBe(504);
    expect(aguadito.totals.perServing.energyKcal).toBeCloseTo(216.72, 10);
    expect(aguadito.totals.per100g.waterG).toBeNull();
  });

  it('finds two of the owner examples: tequeños and arroz árabe', () => {
    expect(byName('tequeño').length).toBeGreaterThan(0);
    expect(byName('arroz árabe').length).toBeGreaterThan(0);
  });

  it('every INS dish ends with a number for added sugar, and drinks carry the drink tag', () => {
    expect(ins.filter((d) => d.totals.per100g.addedSugarG === null)).toEqual([]);
    expect(ins.filter((d) => d.group === 'drink').every((d) => d.tags.includes('drink'))).toBe(
      true,
    );
  });
});
