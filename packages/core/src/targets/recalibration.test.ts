import { describe, expect, it } from 'vitest';
import { weightTrend, type WeightEntry } from '../body/weight-trend';
import { recalibrate, type EnergyDay } from './recalibration';

function date(day: number): string {
  return `2026-10-${String(day).padStart(2, '0')}`;
}

/** Days 1…n with a weigh-in each morning and the same intake and estimated expenditure. */
function window(
  n: number,
  weightOn: (day: number) => number,
  intakeKcal: number | null = 2000,
  expenditureKcal = 2500,
): { days: EnergyDay[]; weights: WeightEntry[] } {
  const range = Array.from({ length: n }, (_, i) => i + 1);
  return {
    days: range.map((day) => ({ date: date(day), intakeKcal, expenditureKcal })),
    weights: range.map((day) => ({ date: date(day), kg: weightOn(day) })),
  };
}

describe('recalibrate: real expenditure from the weight trend, ±10% per step (ADR 0009)', () => {
  it('scales the factor by real ÷ estimated expenditure', () => {
    const { days, weights } = window(15, (day) => 80 - 0.05 * (day - 1), 2300);
    const trend = weightTrend(weights);
    const changeKg = trend.at(-1)!.trendKg - trend[0]!.trendKg;
    // Energy days are 1…14: the morning weight of day 15 reflects what was eaten up to day 14.
    const realExpenditure = 14 * 2300 - changeKg * 7700;
    const ratio = realExpenditure / (14 * 2500);
    expect(Math.abs(ratio - 1)).toBeLessThan(0.1); // the example must sit inside the ±10% band

    const result = recalibrate({ days, weights, factor: 1 });

    expect(result.status).toBe('recalibrated');
    expect(result.factor).toBeCloseTo(ratio, 10);
  });

  it('a stable weight while eating 500 kcal under the estimate means the estimate is high, capped at −10%', () => {
    const { days, weights } = window(15, () => 80);
    expect(recalibrate({ days, weights, factor: 1 })).toEqual({
      factor: 0.9,
      status: 'recalibrated',
    });
  });

  it('caps a step at +10% and compounds on the current factor', () => {
    const { days, weights } = window(15, () => 80, 3000, 2500);
    expect(recalibrate({ days, weights, factor: 0.95 }).factor).toBeCloseTo(0.95 * 1.1, 10);
  });

  it('with fewer than 14 weigh-ins the factor stays', () => {
    const { days, weights } = window(13, () => 80);
    expect(recalibrate({ days, weights, factor: 1.05 })).toEqual({
      factor: 1.05,
      status: 'not-enough-weights',
    });
  });

  it('a day without logged intake keeps the factor: the energy balance would be incomplete', () => {
    const { days, weights } = window(15, () => 80);
    days[6] = { ...days[6]!, intakeKcal: null };
    expect(recalibrate({ days, weights, factor: 1 })).toEqual({
      factor: 1,
      status: 'missing-intake',
    });
  });

  it('a day missing from the window counts as missing intake', () => {
    const { days, weights } = window(15, () => 80);
    expect(
      recalibrate({ days: days.filter((d) => d.date !== date(9)), weights, factor: 1 }),
    ).toMatchObject({ status: 'missing-intake' });
  });

  it('uses the trend from the whole history, not a trend restarted at the window', () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      kg: 82,
    }));
    const { days, weights } = window(15, () => 80);
    const withHistory = recalibrate({ days, weights: [...history, ...weights], factor: 1 });
    const windowOnly = recalibrate({ days, weights, factor: 1 });
    expect(withHistory.factor).not.toBe(windowOnly.factor);
  });
});
