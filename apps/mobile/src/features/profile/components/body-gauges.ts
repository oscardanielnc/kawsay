import { gaugePosition, linearScale, type GaugeScale } from '@kawsay/core/gauge/scale';
import type { GaugeBand } from '@/components/data-display/gauge';

/** BMI linear from 15 to 35 (each point is 5% of the arc, so weekly progress shows), WHO bands at real width. */
const BMI_SCALE = linearScale(15, 35, [
  { upTo: 17, tone: 'red' },
  { upTo: 18.5, tone: 'yellow' },
  { upTo: 25, tone: 'green' },
  { upTo: 30, tone: 'yellow' },
  { upTo: 35, tone: 'red' },
]);

/** Waist-to-height (NICE) linear from 0.30 to 0.75 (ADR 0027): blue below 0.5, amber to 0.6, coral above. */
const WAIST_SCALE = linearScale(0.3, 0.75, [
  { upTo: 0.5, tone: 'green' },
  { upTo: 0.6, tone: 'yellow' },
  { upTo: 0.75, tone: 'red' },
]);

const bands = (scale: GaugeScale): readonly GaugeBand[] =>
  scale.zones.map(({ to, tone }) => ({ to, tone }));

export const BMI_BANDS = bands(BMI_SCALE);
export const WAIST_BANDS = bands(WAIST_SCALE);

/** Where a BMI sits on its gauge (0–1), stopped at the ends. */
export const bmiPosition = (bmi: number) => gaugePosition(BMI_SCALE, bmi).position;
/** Where a waist-to-height ratio sits on its gauge (0–1), stopped at the ends. */
export const waistPosition = (ratio: number) => gaugePosition(WAIST_SCALE, ratio).position;
