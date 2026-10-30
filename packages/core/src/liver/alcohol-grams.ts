import type { Tone } from '../shared/tone';

/** Density of ethanol, g/ml. */
const ETHANOL_G_PER_ML = 0.789;

export type AlcoholKind = 'beer' | 'big-beer' | 'wine' | 'pisco' | 'spirit' | 'cocktail';

/** Default volume and % by volume of each drink (F10, owner 2026-10-30); both editable per drink. */
export const ALCOHOL_DEFAULTS: Record<AlcoholKind, { ml: number; abv: number }> = {
  beer: { ml: 330, abv: 5 },
  'big-beer': { ml: 620, abv: 5 },
  wine: { ml: 150, abv: 12 },
  pisco: { ml: 45, abv: 42 },
  spirit: { ml: 45, abv: 40 },
  cocktail: { ml: 60, abv: 40 },
};

/** Grams of alcohol in a drink: ml × % ÷ 100 × 0.789 (F10). */
export function alcoholGrams(ml: number, abvPercent: number): number {
  return ((ml * abvPercent) / 100) * ETHANOL_G_PER_ML;
}

/**
 * Week's alcohol (ADR 0020): none is blue; any is amber; from 210 g (140 g for women) it is coral, the MetALD
 * threshold of the 2023 MASLD nomenclature.
 */
export function alcoholZone(weekGrams: number, sex: 'male' | 'female'): Tone {
  if (weekGrams <= 0) return 'green';
  return weekGrams >= (sex === 'female' ? 140 : 210) ? 'red' : 'yellow';
}
