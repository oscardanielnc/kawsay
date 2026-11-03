import { describe, expect, it } from 'vitest';
import { resolveIds, type Ingredient } from './resolve-ids';

const FOODS = [
  { id: 'ins-c35', name: 'Lúcuma', generic: true },
  { id: 'ins-c36', name: 'Lúcuma, harina de', generic: true },
  { id: 'ins-a37', name: 'Maíz, maicena', generic: true },
  { id: 'ins-l19', name: 'Clavo de olor, molido', generic: true },
  { id: 'leche-entera', name: 'Leche entera' },
  { id: 'ins-x1', name: 'Leche entera, en polvo', generic: true },
];
const recipe = (items: Ingredient[]) => ({
  name: 'Helado de lúcuma',
  items,
});

describe('resolveIds: readable slugs become catalog ids', () => {
  it('"lucuma", "maicena" and "clavo-de-olor" find their INS rows; known ids stay', () => {
    const out = resolveIds(
      recipe([
        { food: 'lucuma', grams: 200 },
        { food: 'maicena', grams: 20 },
        { food: 'clavo-de-olor', grams: 1 },
        { food: 'leche-entera', grams: 300 },
      ]),
      FOODS,
    );
    expect(out.recipe.items.map((i) => i.food)).toEqual([
      'ins-c35',
      'ins-a37',
      'ins-l19',
      'leche-entera',
    ]);
    expect(out.resolved).toHaveLength(3);
  });

  it('an INS code without its prefix ("c35") finds its row', () => {
    expect(resolveIds(recipe([{ food: 'c35', grams: 100 }]), FOODS).recipe.items[0]!.food).toBe(
      'ins-c35',
    );
  });

  it('curated rows win over generic ones with the same words', () => {
    expect(resolveIds(recipe([{ food: 'leche', grams: 100 }]), FOODS).recipe.items[0]!.food).toBe(
      'leche-entera',
    );
  });

  it('ice and a pinch of salt with no row are left out; an unknown food stays so the check fails it', () => {
    const out = resolveIds(
      recipe([
        { food: 'hielo', grams: 200 },
        { food: 'sal', grams: 2 },
        { food: 'unicornio', grams: 100 },
      ]),
      FOODS,
    );
    expect(out.dropped).toEqual(['hielo', 'sal']);
    expect(out.recipe.items).toEqual([{ food: 'unicornio', grams: 100 }]);
  });

  it('two lines that resolve to the same food add up', () => {
    const out = resolveIds(
      recipe([
        { food: 'lucuma', grams: 100 },
        { food: 'ins-c35', grams: 50 },
      ]),
      FOODS,
    );
    expect(out.recipe.items).toEqual([{ food: 'ins-c35', grams: 150 }]);
  });
});
