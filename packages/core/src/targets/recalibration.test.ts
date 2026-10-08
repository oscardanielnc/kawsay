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

  it('a day without logged meals drops its stretch between weigh-ins; the rest still counts', () => {
    const { days, weights } = window(15, () => 80, 2400, 2500);
    days[6] = { ...days[6]!, intakeKcal: null, expenditureKcal: 9999 };
    expect(recalibrate({ days, weights, factor: 1 })).toEqual({
      factor: 2400 / 2500,
      status: 'recalibrated',
    });
  });

  it('drops the weight change of the skipped stretch too, so energy and weight cover the same days', () => {
    // Weight jumps only across the skipped day: if that change were kept, the factor would move.
    const { days, weights } = window(15, (day) => (day <= 7 ? 80 : 79), 2400, 2600);
    days[6] = { ...days[6]!, intakeKcal: null };
    const result = recalibrate({ days, weights, factor: 1 });
    const trend = weightTrend(weights);
    const keptChange = trend.reduce(
      (sum, point, i) => (i === 0 || i === 7 ? sum : sum + point.trendKg - trend[i - 1]!.trendKg),
      0,
    );
    const ratio = (13 * 2400 - keptChange * 7700) / (13 * 2600);
    expect(Math.abs(ratio - 1)).toBeLessThan(0.1); // inside the ±10% band
    expect(result.factor).toBeCloseTo(ratio, 10);
  });

  it('a day missing from the window is treated as not logged', () => {
    const { days, weights } = window(15, () => 80, 2400, 2500);
    expect(
      recalibrate({ days: days.filter((d) => d.date !== date(9)), weights, factor: 1 }),
    ).toMatchObject({ status: 'recalibrated', factor: 2400 / 2500 });
  });

  it('with fewer than 7 logged days the factor stays', () => {
    const { days, weights } = window(15, () => 80);
    for (let i = 0; i < 8; i++) days[i] = { ...days[i]!, intakeKcal: null };
    expect(recalibrate({ days, weights, factor: 1.05 })).toEqual({
      factor: 1.05,
      status: 'not-enough-intake',
    });
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
