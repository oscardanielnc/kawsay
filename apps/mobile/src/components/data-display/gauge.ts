import { color } from '@/lib/theme';

/** Zone colours of the arc gauges (Amanecer: blue in range, amber near, coral far; never text). */
export const GAUGE_COLORS = {
  red: color.coral300,
  yellow: color.amber300,
  green: color.blue300,
} as const;

export type GaugeTone = keyof typeof GAUGE_COLORS;
/** A zone of the arc, from the previous band's end to `to` (0 left → 1 right). */
export interface GaugeBand {
  to: number;
  tone: GaugeTone;
}

/** Half the width over which two neighbouring zones blend. */
const BLEND = 0.035;

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (values: number[]) =>
  `#${values.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/** Colour of the arc at a position (0–1): solid inside each zone, blended across its limits. */
export function gaugeColorAt(position: number, bands: readonly GaugeBand[]): string {
  const p = Math.min(1, Math.max(0, position));
  let from = 0;
  for (let i = 0; i < bands.length; i++) {
    const band = bands[i]!;
    if (p <= band.to || i === bands.length - 1) {
      const here = GAUGE_COLORS[band.tone];
      const prev = bands[i - 1];
      const next = bands[i + 1];
      if (prev && p < from + BLEND)
        return mix(GAUGE_COLORS[prev.tone], here, (p - from + BLEND) / (2 * BLEND));
      if (next && p > band.to - BLEND)
        return mix(here, GAUGE_COLORS[next.tone], (p - band.to + BLEND) / (2 * BLEND));
      return here;
    }
    from = band.to;
  }
  return GAUGE_COLORS[bands.at(-1)!.tone];
}

function mix(a: string, b: string, t: number): string {
  if (a === b) return a;
  const [x, y] = [channels(a), channels(b)];
  return toHex(x.map((v, k) => v + (y[k]! - v) * t));
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
