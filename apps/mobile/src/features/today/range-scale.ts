import type { RANGE_ZONES } from '@kawsay/core/day/range-state';

type Zone = (typeof RANGE_ZONES)[keyof typeof RANGE_ZONES];

/**
 * Where each zone limit sits on the track (0–1). Zones get fixed widths instead of a linear 0–200% scale, so the
 * green limits stay far apart even when green is only 90–110% (calories).
 */
export const TRACK_STOPS = {
  yellowFrom: 0.1,
  greenFrom: 0.28,
  greenTo: 0.72,
  yellowTo: 0.9,
} as const;

/** Position on the track (0–1) of a value given as % of the target; linear inside each zone. */
export function trackPosition(percent: number, zone: Zone): number {
  // The high red zone is as wide, in % of target, as the low red zone, so both ends read alike.
  const end = zone.yellowTo + zone.yellowFrom;
  const points: [number, number][] = [
    [0, 0],
    [zone.yellowFrom, TRACK_STOPS.yellowFrom],
    [zone.greenFrom, TRACK_STOPS.greenFrom],
    [zone.greenTo, TRACK_STOPS.greenTo],
    [zone.yellowTo, TRACK_STOPS.yellowTo],
    [end, 1],
  ];
  if (percent <= 0) return 0;
  if (percent >= end) return 1;
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]!;
    const [x0, y0] = points[i - 1]!;
    if (percent <= x1) return y0 + ((percent - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 1;
}
