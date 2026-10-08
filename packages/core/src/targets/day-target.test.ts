import { describe, expect, it } from 'vitest';
import { dayActivityKcal } from '../energy/activity';
import { basalMetabolicRate } from '../energy/bmr';
import { dayTarget, goalPace } from './day-target';

const bmrKcal = basalMetabolicRate({ sex: 'male', weightKg: 80, heightCm: 170, ageYears: 30 });
const defaultDay = dayActivityKcal({ bmrKcal, wakingHours: 16, blocks: [] });

describe('dayTarget: expenditure − deficit, never below BMR (ADR 0009)', () => {
  it('male, 30 y, 170 cm, 80 kg, default activity, −0.5 kg/week → ≈ 1,840 kcal (F09)', () => {
    const day = dayTarget({ bmrKcal, activityKcal: defaultDay, weightKg: 80, goalKgPerWeek: -0.5 });
    expect(day.deficitKcal).toBeCloseTo(550, 10);
    expect(day.targetKcal).toBeCloseTo(1840, -1);
  });

  it('expenditure applies the thermic effect to the BMR (activity kcal already include it)', () => {
    const day = dayTarget({ bmrKcal: 2000, activityKcal: 300, weightKg: 80, goalKgPerWeek: 0 });
    expect(day.expenditureKcal).toBeCloseTo(2000 * 1.1 + 300, 10);
  });

  it('scales the expenditure by the recalibration factor, but the floor stays the BMR', () => {
    const day = dayTarget({
      bmrKcal: 2000,
      activityKcal: 300,
      weightKg: 80,
      goalKgPerWeek: 0,
      expenditureFactor: 0.9,
    });
    expect(day.expenditureKcal).toBeCloseTo((2000 * 1.1 + 300) * 0.9, 10);
  });

  it('caps the deficit at 1% of body weight per week', () => {
    const day = dayTarget({ bmrKcal: 2000, activityKcal: 1000, weightKg: 60, goalKgPerWeek: -1 });
    expect(day.deficitKcal).toBeCloseTo((0.6 * 7700) / 7, 10);
  });

  it('caps the deficit at 25% of expenditure', () => {
    const day = dayTarget({ bmrKcal, activityKcal: defaultDay, weightKg: 80, goalKgPerWeek: -0.8 });
    expect(day.deficitKcal).toBeCloseTo(day.expenditureKcal * 0.25, 10);
  });

  it('never goes below the BMR', () => {
    const day = dayTarget({ bmrKcal, activityKcal: 0, weightKg: 80, goalKgPerWeek: -0.8 });
    expect(day.targetKcal).toBe(bmrKcal);
  });

  it('no deficit when the goal is not a loss', () => {
    const day = dayTarget({ bmrKcal, activityKcal: defaultDay, weightKg: 80, goalKgPerWeek: 0.2 });
    expect(day.deficitKcal).toBe(0);
    expect(day.targetKcal).toBe(day.expenditureKcal);
  });

  it('logging an activity raises the target (F09)', () => {
    const rest = dayTarget({
      bmrKcal,
      activityKcal: defaultDay,
      weightKg: 80,
      goalKgPerWeek: -0.5,
    });
    const stairs = dayTarget({
      bmrKcal,
      activityKcal: dayActivityKcal({
        bmrKcal,
        wakingHours: 16,
        blocks: [{ met: 6.8, hours: 0.5 }],
      }),
      weightKg: 80,
      goalKgPerWeek: -0.5,
    });
    expect(stairs.targetKcal).toBeGreaterThan(rest.targetKcal);
  });
});

describe('goalPace (F01)', () => {
  it('a goal of −10 kg in 4 weeks warns and suggests 13 weeks at 1% per week', () => {
    expect(goalPace({ currentKg: 80, goalKg: 70, weeks: 4 })).toEqual({
      kgPerWeek: -2.5,
      tooFast: true,
      suggestedWeeks: 13,
    });
  });

  it('a pace within 1% per week needs no suggestion', () => {
    expect(goalPace({ currentKg: 80, goalKg: 76, weeks: 8 })).toEqual({
      kgPerWeek: -0.5,
      tooFast: false,
      suggestedWeeks: null,
    });
  });

  it('suggests exact weeks despite floating point: 80 → 65.6 kg is 18 weeks, not 19', () => {
    expect(goalPace({ currentKg: 80, goalKg: 65.6, weeks: 4 }).suggestedWeeks).toBe(18);
  });

  it('rejects a goal date that is not in the future', () => {
    expect(() => goalPace({ currentKg: 80, goalKg: 70, weeks: 0 })).toThrow(RangeError);
  });
});
