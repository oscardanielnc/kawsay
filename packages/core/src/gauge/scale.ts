import { assertPositive } from '../shared/assert';
import type { Tone } from '../shared/tone';

/** A zone of the arc, as fractions of its length (0 left end → 1 right end). */
export interface GaugeZone {
  from: number;
  to: number;
  tone: Tone;
}

/** A linear gauge from `min` to `max` in the metric's own unit, with its zones at their real width (ADR 0027). */
export interface GaugeScale {
  min: number;
  max: number;
  zones: readonly GaugeZone[];
}

/** Two-sided gauges end this share of the target past the start of the upper coral zone. */
const TWO_SIDED_TAIL = 0.4;
/** One-sided gauges end at this multiple of the start of coral. */
const ONE_SIDED_TAIL = 1.5;

/** A linear scale from `min` to `max`; each zone runs from the previous limit up to `upTo` (the last one to `max`). */
export function linearScale(
  min: number,
  max: number,
  limits: readonly { upTo: number; tone: Tone }[],
): GaugeScale {
  if (!(max > min)) throw new RangeError(`max must be above min, got ${min}–${max}`);
  const at = (value: number) => Math.min(1, Math.max(0, (value - min) / (max - min)));
  const zones = limits.map((limit, i) => ({
    from: i === 0 ? 0 : at(limits[i - 1]!.upTo),
    to: i === limits.length - 1 ? 1 : at(limit.upTo),
    tone: limit.tone,
  }));
  return { min, max, zones };
}

/**
 * Calories and macros: limits as % of the target (range thresholds of design/direction.md), from 0 to the start of
 * the upper coral zone + 40% of the target. Target 2,000 kcal → 0–3,200.
 */
export function twoSidedScale(
  target: number,
  zone: { yellowFrom: number; greenFrom: number; greenTo: number; yellowTo: number },
): GaugeScale {
  assertPositive({ target });
  const of = (percent: number) => (target * percent) / 100;
  return linearScale(0, of(zone.yellowTo) + target * TWO_SIDED_TAIL, [
    { upTo: of(zone.yellowFrom), tone: 'red' },
    { upTo: of(zone.greenFrom), tone: 'yellow' },
    { upTo: of(zone.greenTo), tone: 'green' },
    { upTo: of(zone.yellowTo), tone: 'yellow' },
    { upTo: Infinity, tone: 'red' },
  ]);
}

/** Added sugar and refined flours: blue up to `ideal`, amber up to `max`, coral up to 1.5 × `max`. */
export function oneSidedScale(ideal: number, max: number): GaugeScale {
  assertPositive({ max });
  return linearScale(0, max * ONE_SIDED_TAIL, [
    { upTo: ideal, tone: 'green' },
    { upTo: max, tone: 'yellow' },
    { upTo: Infinity, tone: 'red' },
  ]);
}

/** Needle position (0–1), stopped at both ends; `overflow` when the value is past the maximum (shown with "+"). */
export function gaugePosition(
  scale: GaugeScale,
  value: number,
): { position: number; overflow: boolean } {
  const raw = (value - scale.min) / (scale.max - scale.min);
  return { position: Math.min(1, Math.max(0, raw)), overflow: value > scale.max };
}
