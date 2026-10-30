import { color } from '@/lib/theme';

/** The Amanecer gauge (docs/design/explorations/2026-10-30-amanecer): arc centre (100, 100), radius 78. */
export const GAUGE_BOX = { width: 200, height: 112, cx: 100, cy: 100, r: 78 } as const;

export type Zone = 'in' | 'near' | 'far';
export type GaugeKind = 'two-sided' | 'one-sided';

export const ZONE_COLOR: Record<Zone, string> = {
  in: color.blue300,
  near: color.amber300,
  far: color.coral300,
};

/**
 * Fixed zone widths, left to right. Two-sided (calories, macros): coral 10 · amber 18 · blue 44 · amber 18 ·
 * coral 10 %. One-sided (added sugar, refined flours): blue 3/7 · amber 2/7 · coral 2/7.
 */
export const ZONES: Record<GaugeKind, readonly { to: number; zone: Zone }[]> = {
  'two-sided': [
    { to: 0.1, zone: 'far' },
    { to: 0.28, zone: 'near' },
    { to: 0.72, zone: 'in' },
    { to: 0.9, zone: 'near' },
    { to: 1, zone: 'far' },
  ],
  'one-sided': [
    { to: 3 / 7, zone: 'in' },
    { to: 5 / 7, zone: 'near' },
    { to: 1, zone: 'far' },
  ],
};

/** The arcs as drawn in the mockup, with a small gap between zones. */
export const ZONE_PATHS: Record<GaugeKind, readonly string[]> = {
  'two-sided': [
    'M 22.0 100.0 A 78 78 0 0 1 25.0 78.7',
    'M 26.8 73.1 A 78 78 0 0 1 48.1 41.8',
    'M 52.6 38.1 A 78 78 0 0 1 147.4 38.1',
    'M 151.9 41.8 A 78 78 0 0 1 173.2 73.1',
    'M 175.0 78.7 A 78 78 0 0 1 178.0 100.0',
  ],
  'one-sided': [
    'M 22.0 100.0 A 78 78 0 0 1 79.8 24.7',
    'M 85.5 23.4 A 78 78 0 0 1 146.3 37.2',
    'M 150.9 40.9 A 78 78 0 0 1 178.0 100.0',
  ],
};

/** Needle angle in degrees for a position 0–1: 0 points left (0°), 1 points right (180°); clamped. */
export function needleAngle(position: number): number {
  return Math.min(1, Math.max(0, position)) * 180;
}

/** Zone under a position (0–1) of a gauge kind; a limit belongs to the zone it closes. */
export function zoneAt(position: number, kind: GaugeKind): Zone {
  const p = Math.min(1, Math.max(0, position));
  return ZONES[kind].find((z) => p <= z.to)?.zone ?? 'far';
}

/**
 * Position on a two-sided gauge of a value given as % of its target, with the metric's zone limits in % (range
 * thresholds of design/direction.md): each limit sits on its zone edge, 0 % at the left end, 20 % past the amber
 * ceiling at the right end.
 */
export function twoSidedPosition(
  percent: number,
  zone: { yellowFrom: number; greenFrom: number; greenTo: number; yellowTo: number },
): number {
  return piecewise(percent, [
    [0, 0],
    [zone.yellowFrom, 0.1],
    [zone.greenFrom, 0.28],
    [zone.greenTo, 0.72],
    [zone.yellowTo, 0.9],
    [zone.yellowTo * 1.2, 1],
  ]);
}

/** Position on a one-sided gauge: blue up to `ideal` (3/7), amber up to `max` (5/7), coral up to 1.5 × max. */
export function oneSidedPosition(value: number, ideal: number, max: number): number {
  return piecewise(value, [
    [0, 0],
    [ideal, 3 / 7],
    [max, 5 / 7],
    [max * 1.5, 1],
  ]);
}

/** Linear inside each segment of `points` ([x, y] sorted by x), clamped to the first and last y. */
export function piecewise(x: number, points: readonly (readonly [number, number])[]): number {
  const first = points[0]!;
  const last = points.at(-1)!;
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]!;
    const [x0, y0] = points[i - 1]!;
    if (x <= x1) return x1 === x0 ? y1 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return last[1];
}
