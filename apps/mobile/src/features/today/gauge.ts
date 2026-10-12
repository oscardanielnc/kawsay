import { TRACK_STOPS } from './range-scale';

/** Pastel zone colours of the range gauge (design: soft, never text). */
export const GAUGE_COLORS = { red: '#F2B5A9', yellow: '#F5DE9A', green: '#A9D8B8' } as const;

/**
 * Colour stops along the arc (0 left → 1 right): solid in the middle of each zone, blended across its limits, so the
 * gauge reads as one soft band.
 */
const STOPS: readonly [number, string][] = [
  [0, GAUGE_COLORS.red],
  [TRACK_STOPS.yellowFrom - 0.04, GAUGE_COLORS.red],
  [(TRACK_STOPS.yellowFrom + TRACK_STOPS.greenFrom) / 2, GAUGE_COLORS.yellow],
  [TRACK_STOPS.greenFrom + 0.06, GAUGE_COLORS.green],
  [TRACK_STOPS.greenTo - 0.06, GAUGE_COLORS.green],
  [(TRACK_STOPS.greenTo + TRACK_STOPS.yellowTo) / 2, GAUGE_COLORS.yellow],
  [TRACK_STOPS.yellowTo + 0.04, GAUGE_COLORS.red],
  [1, GAUGE_COLORS.red],
];

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (values: number[]) =>
  `#${values.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/** Colour of the arc at a track position (0–1). */
export function gaugeColorAt(position: number): string {
  const p = Math.min(1, Math.max(0, position));
  for (let i = 1; i < STOPS.length; i++) {
    const [x1, c1] = STOPS[i]!;
    const [x0, c0] = STOPS[i - 1]!;
    if (p > x1) continue;
    if (c0 === c1 || x1 === x0) return c1;
    const t = (p - x0) / (x1 - x0);
    const a = channels(c0);
    const b = channels(c1);
    return toHex(a.map((v, k) => v + (b[k]! - v) * t));
  }
  return STOPS.at(-1)![1];
}

/** Point on a semicircle of radius `r` around (cx, cy): position 0 is the left end, 1 the right end. */
export function gaugePoint(
  position: number,
  r: number,
  { cx, cy }: { cx: number; cy: number },
): { x: number; y: number } {
  const angle = Math.PI * (1 - position);
  return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
}
