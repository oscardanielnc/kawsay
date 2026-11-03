import { describe, expect, it } from 'vitest';
import { buildCatalog, readInputs } from '../build-catalog.ts';
import { CATEGORIES } from './categories.ts';
import {
  checkRecipe,
  dedupeNames,
  estimatedId,
  normalizeName,
  Recipe,
  type Recipe as RecipeT,
} from './recipe.ts';

const catalog = buildCatalog(readInputs(new URL('../..', import.meta.url)));
const foods = new Map(catalog.foods.map((f) => [f.id, f]));
const postres = CATEGORIES.find((c) => c.id === 'postres')!;
const criollo = CATEGORIES.find((c) => c.id === 'criollo')!;

/** A fixture recipe: a plausible tres leches made of catalog foods. */
const tresLeches: RecipeT = {
  name: 'Torta tres leches',
  icon: 'dulce',
  serving: '1 tajada',
  servings: 10,
  items: [
    { food: 'huevo', grams: 300 },
    { food: 'azucar', grams: 250 },
    { food: 'harina-trigo', grams: 200 },
    { food: 'leche-entera', grams: 400 },
  ],
};

describe('Recipe schema (ADR 0028: the AI picks, the table computes)', () => {
  it('accepts ids, grams, servings, unit and icon', () => {
    expect(Recipe.safeParse(tresLeches).success).toBe(true);
  });

  it('has no nutrient field: kcal sent by a model are dropped', () => {
    const parsed = Recipe.parse({ ...tresLeches, kcal: 999, items: tresLeches.items });
    expect(parsed).not.toHaveProperty('kcal');
  });

  it('rejects an icon the app does not have and empty ingredients', () => {
    expect(Recipe.safeParse({ ...tresLeches, icon: 'pizza' }).success).toBe(false);
    expect(Recipe.safeParse({ ...tresLeches, items: [] }).success).toBe(false);
  });
});

describe('checkRecipe: automatic checks before a dish ships', () => {
  it('a plausible dessert passes, with its totals from the table', () => {
    const missing = tresLeches.items.filter((i) => !foods.has(i.food));
    expect(missing).toEqual([]);
    const checked = checkRecipe(tresLeches, postres, foods);
    expect(checked.errors).toEqual([]);
    expect(checked.totals?.perServing.energyKcal).toBeGreaterThan(150);
  });

  it('an id the catalog does not hold fails', () => {
    const checked = checkRecipe(
      { ...tresLeches, items: [{ food: 'unicornio', grams: 100 }] },
      postres,
      foods,
    );
    expect(checked.ok).toBe(false);
    expect(checked.errors[0]).toMatch(/unknown food ids: unicornio/);
  });

  it('a serving far outside the category range fails', () => {
    const checked = checkRecipe({ ...tresLeches, servings: 1 }, postres, foods);
    expect(checked.ok).toBe(false);
    expect(checked.errors.join()).toMatch(/kcal per serving/);
  });

  it('a main dish made only of sugar fails the per 100 g range', () => {
    const sugar = { ...tresLeches, items: [{ food: 'azucar', grams: 400 }], servings: 1 };
    expect(checkRecipe(sugar, criollo, foods).errors.join()).toMatch(/kcal per 100 g/);
  });
});

describe('names', () => {
  it('normalizes accents and punctuation', () => {
    expect(normalizeName('Suspiro a la Limeña!')).toBe(
      'suspiro a la limeña'.normalize('NFD').replace(/\p{M}/gu, ''),
    );
    expect(estimatedId('Torta helada')).toBe('est-torta-helada');
  });

  it('drops a name already in the catalog or seen as an alias', () => {
    const kept = dedupeNames(
      [
        { name: 'Ají de gallina', aliases: [], category: 'criollo' },
        { name: 'Torta helada', aliases: ['Gelatina con torta'], category: 'postres' },
        { name: 'Gelatina con torta', aliases: [], category: 'postres' },
        { name: 'Picarones', aliases: [], category: 'postres' },
      ],
      ['Aji de gallina'],
    );
    expect(kept.map((k) => k.name)).toEqual(['Torta helada', 'Picarones']);
  });
});
