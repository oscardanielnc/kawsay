import { describe, expect, it } from 'vitest';
import { buildCatalog, readInputs } from './build-catalog.ts';

const inputs = readInputs(new URL('..', import.meta.url));
const catalog = buildCatalog(inputs);
const food = (id: string) => catalog.foods.find((f) => f.id === id);
const dish = (id: string) => catalog.dishes.find((d) => d.id === id);

describe('food tags (F24, ADR 0020)', () => {
  it('A juane counts the carbohydrate of its rice as refined flour, not the rest of the dish', () => {
    const juane = dish('juane-gallina')!;
    const rice = food('arroz-cocido')!;
    const riceCarbs = ((rice.per100g?.carbsTotalG ?? 0) * 250) / 100;
    expect(juane.totals.perServing.refinedFlourCarbsG).toBeCloseTo(riceCarbs, 10);
    expect(juane.totals.perServing.carbsTotalG).toBeGreaterThan(riceCarbs);
    expect(juane.tags).toEqual(['refined-flour']);
  });

  it('a tagged food carries all its carbohydrate as refined flour; an untagged one none', () => {
    expect(food('pan-frances')?.per100g?.refinedFlourCarbsG).toBe(
      food('pan-frances')?.per100g?.carbsTotalG,
    );
    expect(food('avena')?.per100g?.refinedFlourCarbsG).toBe(0);
    expect(food('pan-integral-molde')?.tags).not.toContain('refined-flour');
  });

  it('drinks are tagged, and dishes of group drink inherit it', () => {
    expect(food('coca-cola')?.tags).toContain('drink');
    expect(food('ins-h11')?.tags).toContain('drink');
    expect(dish('refresco-limon')?.tags).toContain('drink');
    expect(dish('juane-gallina')?.tags).not.toContain('drink');
  });

  it('a tag naming a food that does not exist fails the build', () => {
    const broken = { ...inputs, tags: { ...inputs.tags, drink: ['no-such-food'] } };
    expect(() => buildCatalog(broken)).toThrow(/no-such-food/);
  });
});
