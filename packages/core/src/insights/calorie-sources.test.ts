import { describe, expect, it } from 'vitest';
import { foodBucket, itemParts, weeklyCalorieSources, type BucketFood } from './calorie-sources';

const food = (name: string, extra: Partial<BucketFood> = {}): BucketFood => ({
  name,
  tags: [],
  insCode: null,
  per100g: { energyKcal: 100, addedSugarG: 0 },
  ...extra,
});
const rice = food('Arroz blanco cocido', { tags: ['refined-flour'], per100g: { energyKcal: 130 } });
const bread = food('Pan francés', { tags: ['refined-flour'], per100g: { energyKcal: 280 } });
const sugar = food('Azúcar blanca', { per100g: { energyKcal: 400, addedSugarG: 100 } });
const chicken = food('Pollo', { per100g: { energyKcal: 200 } });
const strawberry = food('Fresa', { insCode: 'C18', per100g: { energyKcal: 34 } });

describe('foodBucket', () => {
  it('places rice, other refined flours, sweets, fruit and the rest', () => {
    expect(foodBucket(rice)).toBe('rice');
    expect(foodBucket(bread)).toBe('flour');
    expect(foodBucket(sugar)).toBe('sweets');
    expect(foodBucket(strawberry)).toBe('fruit');
    expect(foodBucket(chicken)).toBe('other');
  });

  it('a sugary cookie counts as flour, not as a sweet', () => {
    const cookie = food('Galleta de vainilla', {
      tags: ['refined-flour'],
      per100g: { energyKcal: 450, addedSugarG: 30 },
    });
    expect(foodBucket(cookie)).toBe('flour');
  });
});

describe('itemParts', () => {
  it('a food goes whole into its bucket', () => {
    expect(
      itemParts({ name: 'Pan francés', kcal: 140, food: bread, addedSugarG: 0, refinedFlourG: 28 }),
    ).toEqual([{ bucket: 'flour', kcal: 140, name: 'Pan francés' }]);
  });

  it('arroz con pollo splits its 600 kcal by the energy of its rice and its chicken', () => {
    const parts = itemParts({
      name: 'Arroz con pollo',
      kcal: 600,
      ingredients: [
        { food: rice, grams: 200 }, // 260 kcal
        { food: chicken, grams: 170 }, // 340 kcal
      ],
      addedSugarG: 0,
      refinedFlourG: 56,
    });
    expect(parts).toEqual([
      { bucket: 'rice', kcal: 260, name: 'Arroz con pollo' },
      { bucket: 'other', kcal: 340, name: 'Arroz con pollo' },
    ]);
  });

  it('a dish without ingredients splits by its refined flour and added sugar, the rest is other', () => {
    expect(
      itemParts({ name: 'Torta helada', kcal: 300, addedSugarG: 25, refinedFlourG: 30 }),
    ).toEqual([
      { bucket: 'flour', kcal: 120, name: 'Torta helada' },
      { bucket: 'sweets', kcal: 100, name: 'Torta helada' },
      { bucket: 'other', kcal: 80, name: 'Torta helada' },
    ]);
  });
});

describe('weeklyCalorieSources', () => {
  const day = [
    { bucket: 'rice' as const, kcal: 600, name: 'Arroz con pollo' },
    { bucket: 'sweets' as const, kcal: 200, name: 'Inca Kola' },
    { bucket: 'other' as const, kcal: 1000, name: 'Pollo' },
  ];

  it('needs 3 logged days', () => {
    expect(weeklyCalorieSources([day, day, []])).toEqual({
      status: 'need-days',
      countedDays: 2,
      neededDays: 3,
    });
  });

  it('averages per logged day, largest first, with each bucket share and its top items', () => {
    const out = weeklyCalorieSources([day, day, day, []]);
    if (out.status !== 'ok') throw new Error('expected ok');
    expect(out.kcalPerDay).toBe(1800);
    expect(out.rows.map((r) => [r.bucket, r.kcalPerDay, Number(r.share.toFixed(3))])).toEqual([
      ['other', 1000, 0.556],
      ['rice', 600, 0.333],
      ['sweets', 200, 0.111],
    ]);
    expect(out.rows[1]!.top).toEqual([{ name: 'Arroz con pollo', kcal: 1800 }]);
  });
});
