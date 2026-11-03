import { describe, expect, it } from 'vitest';
import { AiDishProposal, AiDishRequest, CatalogDishesResponse } from './catalog';

describe('catalog contracts (ADR 0028)', () => {
  it('a proposal has ids and grams and no nutrient field', () => {
    const ok = {
      name: 'Torta helada',
      icon: 'dulce',
      servings: 8,
      items: [{ food: 'gelatina', grams: 200 }],
    };
    expect(AiDishProposal.safeParse(ok).success).toBe(true);
    expect(AiDishProposal.safeParse({ ...ok, kcal: 300 }).success).toBe(false);
  });

  it('the request carries only a name, trimmed and bounded', () => {
    expect(AiDishRequest.parse({ name: '  tequeños ' })).toEqual({ name: 'tequeños' });
    expect(AiDishRequest.safeParse({ name: 'x' }).success).toBe(false);
  });

  it('an up-to-date answer carries no dishes', () => {
    expect(CatalogDishesResponse.safeParse({ version: 'abc', upToDate: true }).success).toBe(true);
  });
});
