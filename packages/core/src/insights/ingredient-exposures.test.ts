import { describe, expect, it } from 'vitest';
import { ingredientsEaten } from './ingredient-exposures';

const causa = [
  { food: 'papa-amarilla', grams: 200 },
  { food: 'pollo', grams: 80 },
  { food: 'aceituna-botija', grams: 10 },
  { food: 'palta', grams: 60 },
];

describe('ingredientsEaten (F17)', () => {
  it('a garnish of 10 g in a 350 g causa is not counted as eaten', () => {
    expect(ingredientsEaten(causa, 350)).toEqual(['papa-amarilla', 'pollo', 'palta']);
  });

  it('half a serving keeps only what still reaches 25 g', () => {
    expect(ingredientsEaten(causa, 175)).toEqual(['papa-amarilla', 'pollo', 'palta']);
    expect(ingredientsEaten(causa, 100)).toEqual(['papa-amarilla']);
  });

  it('without the grams eaten, the whole recipe counts as one serving', () => {
    expect(ingredientsEaten(causa, null)).toEqual(['papa-amarilla', 'pollo', 'palta']);
  });

  it('an empty recipe gives no ingredients', () => {
    expect(ingredientsEaten([], 300)).toEqual([]);
  });
});
