import { describe, expect, it } from 'vitest';
import { recipeTotals } from './recipe-totals';

const KEYS = ['energyKcal', 'proteinG', 'ironMg'] as const;
const rice = { energyKcal: 115, proteinG: 2.4, ironMg: 0.3 };
const chicken = { energyKcal: 175, proteinG: 20, ironMg: null };

describe('recipeTotals (ADR 0014, F07)', () => {
  it('adds each ingredient by its grams and divides by the servings it yields', () => {
    const totals = recipeTotals(
      [
        { per100g: rice, grams: 200 },
        { per100g: chicken, grams: 100 },
      ],
      2,
      KEYS,
    );
    expect(totals.servingGrams).toBe(150);
    expect(totals.perServing.energyKcal).toBeCloseTo((230 + 175) / 2);
    expect(totals.per100g.proteinG).toBeCloseTo(((4.8 + 20) / 300) * 100);
  });

  it('a missing value lowers the coverage instead of counting as 0', () => {
    const totals = recipeTotals(
      [
        { per100g: rice, grams: 200 },
        { per100g: chicken, grams: 100 },
      ],
      1,
      KEYS,
    );
    expect(totals.perServing.ironMg).toBeCloseTo(0.6);
    expect(totals.coverage.ironMg).toBeCloseTo(2 / 3);
  });

  it('a nutrient no ingredient reports stays null ("sin dato")', () => {
    const totals = recipeTotals([{ per100g: chicken, grams: 100 }], 1, KEYS);
    expect(totals.perServing.ironMg).toBeNull();
    expect(totals.coverage.ironMg).toBe(0);
  });

  it('rejects an empty recipe or zero servings', () => {
    expect(() => recipeTotals([], 1, KEYS)).toThrow(RangeError);
    expect(() => recipeTotals([{ per100g: rice, grams: 100 }], 0, KEYS)).toThrow(RangeError);
  });
});
