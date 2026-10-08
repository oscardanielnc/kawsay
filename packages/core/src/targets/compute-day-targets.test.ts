import { describe, expect, it } from 'vitest';
import { routineSessionEnergy } from '../energy/routine';
import { computeDayTargets, type DayInput } from './compute-day-targets';

const day: DayInput = {
  body: { sex: 'male', ageYears: 30, heightCm: 170, weightKg: 80 },
  goalKgPerWeek: -0.5,
  sleepHours: 8,
  activities: [],
  routines: [],
};

describe('computeDayTargets', () => {
  it('male, 30 y, 170 cm, 80 kg, default activity, −0.5 kg/week → ≈ 1,840 kcal · 116 g protein · 51 g fat · 230 g carbohydrates (F09)', () => {
    const t = computeDayTargets(day);
    expect(t.bmrKcal).toBe(1717.5);
    expect(t.targetKcal).toBeCloseTo(1840, -1);
    expect(Math.round(t.proteinG)).toBe(116);
    expect(Math.round(t.fatG)).toBe(51);
    expect(Math.round(t.carbsG)).toBe(230);
  });

  it('logging an activity raises calories, fat and carbohydrates; protein does not change (F09)', () => {
    const rest = computeDayTargets(day);
    const stairs = computeDayTargets({ ...day, activities: [{ met: 6.8, hours: 0.5 }] });
    expect(stairs.targetKcal).toBeGreaterThan(rest.targetKcal);
    expect(stairs.fatG).toBeGreaterThan(rest.fatG);
    expect(stairs.carbsG).toBeGreaterThan(rest.carbsG);
    expect(stairs.proteinG).toBe(rest.proteinG);
  });

  it('a routine session adds its kcal and takes its minutes from the baseline', () => {
    const session = routineSessionEnergy({
      exercises: [{ kind: 'stairs', laps: 6, lapSeconds: 50 }],
      restSeconds: 75,
      bmrKcal: 1717.5,
      completion: 1,
    });
    const rest = computeDayTargets(day);
    const withRoutine = computeDayTargets({ ...day, routines: [session] });
    const baselineMinute = (0.4 * 1717.5 * 1.1) / 24 / 60;
    expect(withRoutine.activityKcal - rest.activityKcal).toBeCloseTo(
      session.kcal - session.minutes * baselineMinute,
      10,
    );
  });

  it('more sleep means fewer waking hours at the baseline MET', () => {
    expect(computeDayTargets({ ...day, sleepHours: 10 }).activityKcal).toBeLessThan(
      computeDayTargets(day).activityKcal,
    );
  });

  it('applies the recalibrated expenditure factor', () => {
    const base = computeDayTargets(day);
    const lower = computeDayTargets({ ...day, expenditureFactor: 0.9 });
    expect(lower.expenditureKcal).toBeCloseTo(base.expenditureKcal * 0.9, 10);
  });

  it('passes the user target settings to the macros', () => {
    expect(computeDayTargets({ ...day, proteinGPerKg: 2 }).proteinG).toBeCloseTo(2 * 72.25, 10);
  });

  it.each([-1, 25])('rejects %d hours of sleep', (sleepHours) => {
    expect(() => computeDayTargets({ ...day, sleepHours })).toThrow(RangeError);
  });
});
