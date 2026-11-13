import { describe, expect, it } from 'vitest';
import { energyGap, labelPer100g } from './label-per-100g';

describe('labelPer100g (F23 piece 3)', () => {
  it('a serving of 30 g with 150 kcal is 500 kcal per 100 g', () => {
    const per100g = labelPer100g({
      basis: 'perServing',
      servingGrams: 30,
      values: { energyKcal: 150, proteinG: 1.5, fatG: 6, carbsTotalG: 22.5, fiberG: 0.6 },
      refinedFlour: false,
    });
    expect(per100g.energyKcal).toBeCloseTo(500);
    expect(per100g.proteinG).toBeCloseTo(5);
    expect(per100g.fatG).toBeCloseTo(20);
    expect(per100g.carbsTotalG).toBeCloseTo(75);
  });

  it('keeps per-100 g values as printed', () => {
    const per100g = labelPer100g({
      basis: 'per100g',
      servingGrams: null,
      values: { energyKcal: 64, sodiumMg: 40 },
      refinedFlour: false,
    });
    expect(per100g.energyKcal).toBe(64);
    expect(per100g.sodiumMg).toBe(40);
  });

  it('a number the label does not print stays null, never 0', () => {
    const per100g = labelPer100g({
      basis: 'per100g',
      servingGrams: null,
      values: { energyKcal: 120, addedSugarG: null },
      refinedFlour: false,
    });
    expect(per100g.addedSugarG).toBeNull();
    expect(per100g.fiberG).toBeNull();
    expect(per100g.carbsAvailableG).toBeNull();
  });

  it('refined flour: available carbohydrate (total − fiber) counts as refined-flour carbohydrate (F24)', () => {
    const cookie = {
      basis: 'per100g' as const,
      servingGrams: null,
      values: { carbsTotalG: 70, fiberG: 2 },
    };
    expect(labelPer100g({ ...cookie, refinedFlour: true }).refinedFlourCarbsG).toBe(68);
    expect(labelPer100g({ ...cookie, refinedFlour: false }).refinedFlourCarbsG).toBe(0);
    expect(labelPer100g({ ...cookie, refinedFlour: false }).carbsAvailableG).toBe(68);
  });

  it('per-serving values without the serving grams are an error', () => {
    expect(() =>
      labelPer100g({
        basis: 'perServing',
        servingGrams: null,
        values: { energyKcal: 150 },
        refinedFlour: false,
      }),
    ).toThrow(/grams of one serving/);
  });
});

describe('energyGap', () => {
  it('is small when the printed energy matches the macronutrients', () => {
    // 4·5 + 9·20 + 4·(75 − 2) + 2·2 = 496 against 500 printed
    expect(
      energyGap({ energyKcal: 500, proteinG: 5, fatG: 20, carbsTotalG: 75, fiberG: 2 }),
    ).toBeLessThan(0.02);
  });

  it('is big when a serving value sits in the 100 g column', () => {
    expect(energyGap({ energyKcal: 150, proteinG: 5, fatG: 20, carbsTotalG: 75 })).toBeGreaterThan(
      1,
    );
  });

  it('is null when a macronutrient is missing', () => {
    expect(energyGap({ energyKcal: 150, proteinG: null, fatG: 20, carbsTotalG: 75 })).toBeNull();
  });
});
