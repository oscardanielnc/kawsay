import { assertPositive } from '../shared/assert';

export type Tone = 'green' | 'yellow' | 'red';

export type BmiBand =
  | 'severe-thinness'
  | 'underweight'
  | 'healthy'
  | 'overweight'
  | 'obesity-1'
  | 'obesity-2'
  | 'obesity-3';

/** WHO adult bands as listed in F01; each applies below its `below` bound. */
const BANDS: readonly { below: number; band: BmiBand; tone: Tone }[] = [
  { below: 17, band: 'severe-thinness', tone: 'red' },
  { below: 18.5, band: 'underweight', tone: 'yellow' },
  { below: 25, band: 'healthy', tone: 'green' },
  { below: 30, band: 'overweight', tone: 'yellow' },
  { below: 35, band: 'obesity-1', tone: 'red' },
  { below: 40, band: 'obesity-2', tone: 'red' },
  { below: Infinity, band: 'obesity-3', tone: 'red' },
];

/** The green range as shown to one decimal. */
export const HEALTHY_BMI = { min: 18.5, max: 24.9 } as const;

export interface BmiStatus {
  bmi: number;
  band: BmiBand;
  tone: Tone;
  /** kg to reach the green range: negative to lose, positive to gain, 0 inside it. */
  kgToHealthy: number;
}

export function weightAtBmi(bmi: number, heightCm: number): number {
  return bmi * (heightCm / 100) ** 2;
}

/**
 * BMI rounded to one decimal and its band (F01). The band is read from the rounded value so the colour always
 * matches the number on screen. Callers pass the trend weight (F03), not the day's raw weight.
 */
export function bmiStatus({
  weightKg,
  heightCm,
}: {
  weightKg: number;
  heightCm: number;
}): BmiStatus {
  assertPositive({ weightKg, heightCm });
  const bmi = Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10;
  const { band, tone } = BANDS.find((b) => bmi < b.below) ?? BANDS[BANDS.length - 1]!;
  const kgToHealthy =
    band === 'healthy'
      ? 0
      : weightAtBmi(bmi > HEALTHY_BMI.max ? HEALTHY_BMI.max : HEALTHY_BMI.min, heightCm) - weightKg;
  return { bmi, band, tone, kgToHealthy };
}
