import { assertPositive } from '../shared/assert';
import { roundTo } from '../shared/round';
import type { Tone } from '../shared/tone';

export type WaistBand = 'healthy' | 'increased' | 'high';

export interface WaistToHeight {
  ratio: number;
  band: WaistBand;
  tone: Tone;
}

/**
 * Waist ÷ height rounded to two decimals, banded by NICE 2022 (F04): < 0.5 · 0.5–0.59 · ≥ 0.6.
 * The band is read from the rounded value so the colour matches the number on screen.
 */
export function waistToHeight({
  waistCm,
  heightCm,
}: {
  waistCm: number;
  heightCm: number;
}): WaistToHeight {
  assertPositive({ waistCm, heightCm });
  const ratio = roundTo(waistCm / heightCm, 2);
  if (ratio < 0.5) return { ratio, band: 'healthy', tone: 'green' };
  if (ratio < 0.6) return { ratio, band: 'increased', tone: 'yellow' };
  return { ratio, band: 'high', tone: 'red' };
}
