import { describe, expect, it } from 'vitest';
import { crossCheck } from './cross-check.ts';

const rows = (kcal: string[]) =>
  kcal.map((energy_kcal, i) => ({ code: 'SE9', stratum: 'ABCDE'[i] ?? '', energy_kcal }));

describe('crossCheck: seed recipe vs INS group S, kcal per 100 g (F06)', () => {
  it('compares against the median of the strata', () => {
    const result = crossCheck({
      dishKcalPer100g: 50,
      code: 'SE9',
      rows: rows(['53', '42', '45', '51', '45']),
    });
    expect(result).toMatchObject({ code: 'SE9', referenceKcalPer100g: 45, strata: 5 });
    expect(result.gap).toBeCloseTo(50 / 45 - 1, 10);
    expect(result.flagged).toBe(false);
  });

  it('flags a gap above 20% either way', () => {
    expect(crossCheck({ dishKcalPer100g: 60, code: 'SE9', rows: rows(['45', '45']) }).flagged).toBe(
      true,
    );
    expect(crossCheck({ dishKcalPer100g: 30, code: 'SE9', rows: rows(['45']) }).flagged).toBe(true);
  });

  it('20% exactly is still within range', () => {
    expect(crossCheck({ dishKcalPer100g: 54, code: 'SE9', rows: rows(['45']) }).flagged).toBe(
      false,
    );
  });

  it('fails when the code has no rows', () => {
    expect(() => crossCheck({ dishKcalPer100g: 50, code: 'SE9', rows: [] })).toThrow(/SE9/);
  });
});
