import type { GaugeZone } from '@kawsay/core/gauge/scale';
import type { Tone } from '@kawsay/core/shared/tone';
import { color } from '@/lib/theme';

/** The Amanecer gauge (docs/design/explorations/2026-10-30-amanecer): arc centre (100, 100), radius 78. */
export const GAUGE_BOX = { width: 200, height: 112, cx: 100, cy: 100, r: 78 } as const;

export const ZONE_COLOR: Record<Tone, string> = {
  green: color.blue300,
  yellow: color.amber300,
  red: color.coral300,
};

/** The small gap between two zones, as in the mockup's paths. */
const GAP_DEG = 4.3;
/** A zone never draws thinner than this, so a narrow one stays visible. */
const MIN_DEG = 1;

/** Point of the arc at `deg` degrees: 0 is the left end, 90 the top, 180 the right end. */
function pointAt(deg: number): string {
  const { cx, cy, r } = GAUGE_BOX;
  const rad = (deg * Math.PI) / 180;
  return `${(cx - r * Math.cos(rad)).toFixed(1)} ${(cy - r * Math.sin(rad)).toFixed(1)}`;
}

/** Arc of one zone in degrees, inset by half a gap where it meets a neighbour; at least MIN_DEG wide. */
export function zoneDegrees(zone: GaugeZone): [number, number] {
  let from = zone.from * 180 + (zone.from > 0 ? GAP_DEG / 2 : 0);
  let to = zone.to * 180 - (zone.to < 1 ? GAP_DEG / 2 : 0);
  if (to - from < MIN_DEG) {
    const middle = Math.min(180 - MIN_DEG / 2, Math.max(MIN_DEG / 2, (from + to) / 2));
    [from, to] = [middle - MIN_DEG / 2, middle + MIN_DEG / 2];
  }
  return [from, to];
}

/** SVG path of each zone, computed from its share of the arc (ADR 0027): no hard-coded paths. */
export function zonePaths(zones: readonly GaugeZone[]): string[] {
  const { r } = GAUGE_BOX;
  return zones.map((zone) => {
    const [from, to] = zoneDegrees(zone);
    return `M ${pointAt(from)} A ${r} ${r} 0 0 1 ${pointAt(to)}`;
  });
}

/** Needle angle in degrees for a position 0–1: 0 points left (0°), 1 points right (180°); clamped. */
export function needleAngle(position: number): number {
  return Math.min(1, Math.max(0, position)) * 180;
}
