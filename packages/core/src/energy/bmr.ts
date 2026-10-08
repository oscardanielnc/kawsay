import { assertPositive } from '../shared/assert';

export type Sex = 'male' | 'female';

export interface Body {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}

/** Resting energy over 24 h, Mifflin-St Jeor (ADR 0009). */
export function basalMetabolicRate({ sex, weightKg, heightCm, ageYears }: Body): number {
  assertPositive({ weightKg, heightCm, ageYears });
  const sexTerm = sex === 'male' ? 5 : -161;
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + sexTerm;
}
