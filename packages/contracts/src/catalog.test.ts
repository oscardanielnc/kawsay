import { describe, expect, it } from 'vitest';
import {
  AiDishProposal,
  AiDishRequest,
  CatalogDishesResponse,
  LabelReadRequest,
  LabelReading,
} from './catalog';

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

describe('label contracts (F23 piece 3)', () => {
  it('the request carries only a base64 image and its type', () => {
    const ok = { imageBase64: 'A'.repeat(200), mimeType: 'image/jpeg' };
    expect(LabelReadRequest.safeParse(ok).success).toBe(true);
    expect(LabelReadRequest.safeParse({ ...ok, userId: 'x' }).success).toBe(false);
    expect(
      LabelReadRequest.safeParse({ ...ok, imageBase64: 'not base64!'.repeat(20) }).success,
    ).toBe(false);
    expect(LabelReadRequest.safeParse({ ...ok, mimeType: 'image/gif' }).success).toBe(false);
  });

  it('a reading keeps unread numbers as null', () => {
    const values = Object.fromEntries(
      [
        'energyKcal',
        'fatG',
        'saturatedFatG',
        'transFatG',
        'cholesterolMg',
        'sodiumMg',
        'carbsTotalG',
        'fiberG',
        'sugarsTotalG',
        'addedSugarG',
        'proteinG',
      ].map((k) => [k, null]),
    );
    const reading = {
      readable: true,
      name: 'Galletas de vainilla',
      brand: null,
      basis: 'perServing',
      servingLabel: '6 galletas',
      servingGrams: 30,
      packageGrams: null,
      isDrink: false,
      refinedFlour: true,
      values: { ...values, energyKcal: 150 },
    };
    expect(LabelReading.safeParse(reading).success).toBe(true);
    expect(
      LabelReading.safeParse({ ...reading, values: { ...values, energyKcal: -1 } }).success,
    ).toBe(false);
  });
});
