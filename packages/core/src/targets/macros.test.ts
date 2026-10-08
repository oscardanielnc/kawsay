import { describe, expect, it } from 'vitest';
import { dayActivityKcal } from '../energy/activity';
import { basalMetabolicRate } from '../energy/bmr';
import { dayTarget } from './day-target';
import { dayMacros, referenceWeightKg } from './macros';

const body = { sex: 'male', weightKg: 80, heightCm: 170, ageYears: 30 } as const;
const bmrKcal = basalMetabolicRate(body);

function targetFor(blocks: { met: number; hours: number }[]): number {
  const activityKcal = dayActivityKcal({ bmrKcal, wakingHours: 16, blocks });
  return dayTarget({ bmrKcal, activityKcal, weightKg: 80, goalKgPerWeek: -0.5 }).targetKcal;
}

describe('referenceWeightKg: min(current, weight at BMI 25) (ADR 0009)', () => {
  it('80 kg at 170 cm uses 72.25 kg', () => {
    expect(referenceWeightKg({ weightKg: 80, heightCm: 170 })).toBeCloseTo(72.25, 10);
  });

  it('a lighter user uses their own weight', () => {
    expect(referenceWeightKg({ weightKg: 60, heightCm: 170 })).toBe(60);
  });
});

describe('dayMacros', () => {
  it('male, 30 y, 170 cm, 80 kg, default activity, −0.5 kg/week → 116 g protein · 51 g fat · 230 g carbohydrates (F09)', () => {
    const macros = dayMacros({ targetKcal: targetFor([]), weightKg: 80, heightCm: 170 });
    expect(Math.round(macros.proteinG)).toBe(116);
    expect(Math.round(macros.fatG)).toBe(51);
    expect(Math.round(macros.carbsG)).toBe(230);
    expect(macros.lowCarbs).toBe(false);
  });

  it('logging an activity raises fat and carbohydrates; protein does not change (F09)', () => {
    const rest = dayMacros({ targetKcal: targetFor([]), weightKg: 80, heightCm: 170 });
    const stairs = dayMacros({
      targetKcal: targetFor([{ met: 6.8, hours: 0.5 }]),
      weightKg: 80,
      heightCm: 170,
    });
    expect(stairs.proteinG).toBe(rest.proteinG);
    expect(stairs.fatG).toBeGreaterThan(rest.fatG);
    expect(stairs.carbsG).toBeGreaterThan(rest.carbsG);
  });

  it('the three macros add back up to the target', () => {
    const targetKcal = 2000;
    const m = dayMacros({ targetKcal, weightKg: 80, heightCm: 170 });
    expect(m.proteinG * 4 + m.fatG * 9 + m.carbsG * 4).toBeCloseTo(targetKcal, 10);
  });

  it('applies the user settings for protein per kg and fat share', () => {
    const m = dayMacros({
      targetKcal: 2000,
      weightKg: 60,
      heightCm: 170,
      proteinGPerKg: 2,
      fatShare: 0.3,
    });
    expect(m.proteinG).toBe(120);
    expect(m.fatG).toBeCloseTo(600 / 9, 10);
  });

  it('warns when carbohydrates fall below 130 g', () => {
    const m = dayMacros({ targetKcal: 1300, weightKg: 80, heightCm: 170, fatShare: 0.35 });
    expect(m.carbsG).toBeLessThan(130);
    expect(m.lowCarbs).toBe(true);
  });

  it.each([{ proteinGPerKg: 1.1 }, { proteinGPerKg: 2.3 }, { fatShare: 0.19 }, { fatShare: 0.36 }])(
    'rejects a setting outside its range: %o',
    (setting) => {
      expect(() =>
        dayMacros({ targetKcal: 2000, weightKg: 80, heightCm: 170, ...setting }),
      ).toThrow(RangeError);
    },
  );
});
