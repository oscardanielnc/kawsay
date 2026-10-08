import { describe, expect, it } from 'vitest';
import { bmiStatus, weightAtBmi } from './bmi';

describe('bmiStatus (F01, WHO adult bands)', () => {
  it('80 kg and 170 cm → BMI 27.7 in yellow, "overweight", −8.0 kg to the green range', () => {
    const status = bmiStatus({ weightKg: 80, heightCm: 170 });
    expect(status).toMatchObject({ bmi: 27.7, band: 'overweight', tone: 'yellow' });
    expect(status.kgToHealthy).toBeCloseTo(-8.0, 1);
  });

  it.each([
    [16.9, 'severe-thinness', 'red'],
    [17, 'underweight', 'yellow'],
    [18.4, 'underweight', 'yellow'],
    [18.5, 'healthy', 'green'],
    [24.9, 'healthy', 'green'],
    [25, 'overweight', 'yellow'],
    [29.9, 'overweight', 'yellow'],
    [30, 'obesity-1', 'red'],
    [35, 'obesity-2', 'red'],
    [40, 'obesity-3', 'red'],
  ] as const)('BMI %d → %s (%s)', (bmi, band, tone) => {
    const weightKg = weightAtBmi(bmi, 170);
    expect(bmiStatus({ weightKg, heightCm: 170 })).toMatchObject({ bmi, band, tone });
  });

  it('classifies on the rounded value the user sees: 24.96 shows 25.0, so it is yellow', () => {
    expect(bmiStatus({ weightKg: weightAtBmi(24.96, 170), heightCm: 170 })).toMatchObject({
      bmi: 25,
      band: 'overweight',
    });
  });

  it('inside the green range there is nothing to change', () => {
    expect(bmiStatus({ weightKg: 65, heightCm: 170 }).kgToHealthy).toBe(0);
  });

  it('below the green range the kg are positive (to gain)', () => {
    expect(bmiStatus({ weightKg: 50, heightCm: 170 }).kgToHealthy).toBeCloseTo(
      18.5 * 1.7 ** 2 - 50,
      10,
    );
  });
});
