import { describe, expect, it } from 'vitest';
import { buildCatalog, readInputs } from './build-catalog.ts';

const inputs = readInputs(new URL('..', import.meta.url));
const catalog = buildCatalog(inputs);

describe('every INS food as an ingredient (F23 piece 2)', () => {
  it('Any INS food can be added to a dish offline: every INS row is in the catalog once', () => {
    const codes = catalog.foods.filter((f) => f.source.kind === 'INS').map((f) => f.source.code);
    expect(new Set(codes).size).toBe(inputs.sources.ins.size);
  });

  it('INS foods outside the seed are generic, named as INS names them, with grams only', () => {
    const quinoa = catalog.foods.find((f) => f.id === 'ins-a53');
    expect(quinoa).toMatchObject({
      name: 'Quinua cocida',
      generic: true,
      units: [],
      source: { kind: 'INS', code: 'A53' },
    });
    expect(catalog.foods.find((f) => f.id === 'arroz-cocido')?.generic).toBeUndefined();
  });

  it('a curated food keeps its INS row: the generic copy is not added twice', () => {
    expect(catalog.foods.find((f) => f.id === 'ins-a2')).toBeUndefined();
  });

  it('every INS food that is packaged, sweetened or a sweet has an explicit added-sugar value', () => {
    const sweet =
      /az[uú]car|dulce|mermelad|n[eé]ctar|jugo|refresco|galleta|queque|panet|wafer|alfajor|chocolat|bebida|chicha|yogurt|envasad|miel|barra de cereal|hojuela azucarada/i;
    const missing = catalog.foods
      .filter((f) => f.generic)
      .filter((f) => sweet.test(f.name) || /^[HKQ]/.test(f.source.code ?? ''))
      .filter((f) => !(f.id in inputs.addedSugar))
      .map((f) => `${f.id} ${f.name}`);
    expect(missing).toEqual([]);
  });
});
