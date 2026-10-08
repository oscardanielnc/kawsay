import { describe, expect, it } from 'vitest';
import { crossCheck, type Survey } from './cross-check.ts';

const rows = (kcal: string[], code = 'SE9') =>
  kcal.map((energy_kcal, i) => ({ code, stratum: 'ABCDE'[i] ?? '', energy_kcal }));
const strong: Survey = { establishments: 61, kcalPer100gMin: 42, kcalPer100gMax: 53 };

describe('crossCheck: seed recipe vs INS group S, kcal per 100 g (F06)', () => {
  it('compares against the median of the strata', () => {
    const result = crossCheck({
      dishKcalPer100g: 50,
      code: 'SE9',
      rows: rows(['53', '42', '45', '51', '45']),
      survey: strong,
    });
    expect(result).toMatchObject({ code: 'SE9', referenceKcalPer100g: 45, strata: 5 });
    expect(result.gap).toBeCloseTo(50 / 45 - 1, 10);
    expect(result.verdict).toBe('within-20');
  });

  it('a recipe inside the range the survey found across strata agrees with it', () => {
    const result = crossCheck({
      dishKcalPer100g: 35,
      code: 'SR12',
      rows: rows(['26', '38', '30', '27', '25'], 'SR12'),
      survey: { establishments: 90, kcalPer100gMin: 25, kcalPer100gMax: 38 },
    });
    expect(result.gap).toBeGreaterThan(0.2);
    expect(result.verdict).toBe('inside-strata-range');
  });

  it('flags a gap above 20% outside the strata range when the reference is strong', () => {
    expect(
      crossCheck({ dishKcalPer100g: 78, code: 'SE9', rows: rows(['45', '45']), survey: strong })
        .verdict,
    ).toBe('outside');
    expect(
      crossCheck({ dishKcalPer100g: 30, code: 'SE9', rows: rows(['45']), survey: strong }).verdict,
    ).toBe('outside');
  });

  it('20% exactly is still within range', () => {
    expect(
      crossCheck({ dishKcalPer100g: 54, code: 'SE9', rows: rows(['45']), survey: strong }).verdict,
    ).toBe('within-20');
  });

  it('a reference measured in fewer than 5 establishments is weak: reported, never a verdict on the recipe', () => {
    const weak = { establishments: 1, kcalPer100gMin: 192, kcalPer100gMax: 192 };
    expect(
      crossCheck({
        dishKcalPer100g: 293,
        code: 'SS238',
        rows: rows(['192'], 'SS238'),
        survey: weak,
      }).verdict,
    ).toBe('weak-reference');
    expect(
      crossCheck({ dishKcalPer100g: 79, code: 'SE144', rows: rows(['36'], 'SE144'), survey: null })
        .verdict,
    ).toBe('weak-reference');
  });

  it('fails when the code has no rows', () => {
    expect(() =>
      crossCheck({ dishKcalPer100g: 50, code: 'SE9', rows: [], survey: strong }),
    ).toThrow(/SE9/);
  });
});
