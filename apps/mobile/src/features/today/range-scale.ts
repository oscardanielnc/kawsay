import type { RANGE_ZONES } from '@kawsay/core/day/range-state';
import { piecewise, TWO_SIDED } from '@/components/data-display/gauge';

type Zone = (typeof RANGE_ZONES)[keyof typeof RANGE_ZONES];

/** Where each zone limit sits on the arc (0–1): the ends of the TWO_SIDED bands, red 2 · yellow 1 · green 1 · … */
export const TRACK_STOPS = {
  yellowFrom: TWO_SIDED[0]!.to,
  greenFrom: TWO_SIDED[1]!.to,
  greenTo: TWO_SIDED[2]!.to,
  yellowTo: TWO_SIDED[3]!.to,
} as const;

/** Position on the arc (0–1) of a value given as % of the target; linear inside each zone. */
export function trackPosition(percent: number, zone: Zone): number {
  // The high red zone is as wide, in % of target, as the low red zone, so both ends read alike.
  return piecewise(percent, [
    [0, 0],
    [zone.yellowFrom, TRACK_STOPS.yellowFrom],
    [zone.greenFrom, TRACK_STOPS.greenFrom],
    [zone.greenTo, TRACK_STOPS.greenTo],
    [zone.yellowTo, TRACK_STOPS.yellowTo],
    [zone.yellowTo + zone.yellowFrom, 1],
  ]);
}
