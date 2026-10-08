import { describe, expect, it } from 'vitest';
import { basalMetabolicRate } from './bmr';

describe('basalMetabolicRate (Mifflin-St Jeor)', () => {
  it('80 kg, 170 cm, 30 years, male → 1717.5 kcal (F01 base target)', () => {
    expect(basalMetabolicRate({ sex: 'male', weightKg: 80, heightCm: 170, ageYears: 30 })).toBe(
      1717.5,
    );
  });

  it('subtracts 161 instead of adding 5 for a female', () => {
    expect(basalMetabolicRate({ sex: 'female', weightKg: 80, heightCm: 170, ageYears: 30 })).toBe(
      1551.5,
    );
  });

  it.each([
    { weightKg: 0, heightCm: 170, ageYears: 30 },
    { weightKg: 80, heightCm: -1, ageYears: 30 },
    { weightKg: 80, heightCm: 170, ageYears: Number.NaN },
  ])('rejects a non-positive or non-numeric body value: %o', (body) => {
    expect(() => basalMetabolicRate({ sex: 'male', ...body })).toThrow(RangeError);
  });
});
