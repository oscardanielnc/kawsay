/** Geometry of a big gauge: centre, radius of the band's middle line and band width, in drawing units. */
export interface GaugeGeometry {
  cx: number;
  cy: number;
  r: number;
  band: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Where one limit label goes: its column, its text line and the leader from the arc to it. */
export interface PlacedLabel {
  /** Index of the limit in the input. */
  index: number;
  fraction: number;
  side: 'left' | 'right';
  /** Centre line of the label text. */
  y: number;
  /** Tick across the band, inner end then outer end. */
  tick: [Point, Point];
  /** Leader: from the tick's outer end to an elbow, then flat to `end`, the inner edge of the label column. */
  elbow: Point;
  end: Point;
  /** Where the text starts (left column, start-anchored) or ends (right column, end-anchored). */
  textX: number;
}

export interface LayoutOptions {
  /** Least distance between two label lines of one column (F26: 30 dp). */
  gap?: number;
  /** Highest label line. */
  top?: number;
  /** Lowest label line: above the end labels under the arc. */
  bottom?: number;
  /** Width kept for a label's number and its two-tone dot. */
  labelWidth?: number;
  /** Space between the drawing's edge and a label. */
  margin?: number;
}

/** Limits this close to the top (as a share of the arc) go to the emptier column. */
const NEAR_TOP = 0.04;
/** Leaders start this far past the band. */
const TICK_OUT = 4;
const TICK_IN = 2;
/** The leader's slanted part reaches at most this far sideways before it turns flat. */
const ELBOW_REACH = 40;

/** Point of the arc at a fraction (0 left end, 1 right end) and a radius. */
export function arcPoint(fraction: number, radius: number, { cx, cy }: GaugeGeometry): Point {
  const angle = Math.PI * (1 - fraction);
  return { x: cx + radius * Math.cos(angle), y: cy - radius * Math.sin(angle) };
}

/**
 * Side columns for the limit labels of a big gauge (F26): limits on the left half go to the left column, on the right
 * half to the right one, a limit near the top to the emptier side. In each column labels keep the arc's order (so
 * leaders never cross), sit at least `gap` apart, and are pushed up together when they would pass `bottom`.
 */
export function layoutLabels(
  fractions: readonly number[],
  geometry: GaugeGeometry,
  {
    gap = 30,
    top = 14,
    bottom = geometry.cy - 26,
    labelWidth = 64,
    margin = 6,
  }: LayoutOptions = {},
): PlacedLabel[] {
  const width = geometry.cx * 2;
  const outer = geometry.r + geometry.band / 2;
  const items = fractions.map((fraction, index) => ({
    index,
    fraction,
    anchor: arcPoint(fraction, outer + TICK_OUT + 2, geometry),
  }));
  const left: typeof items = [];
  const right: typeof items = [];
  for (const item of items) {
    if (Math.abs(item.fraction - 0.5) < NEAR_TOP)
      (left.length <= right.length ? left : right).push(item);
    else (item.fraction < 0.5 ? left : right).push(item);
  }

  const placed: PlacedLabel[] = [];
  for (const [side, column] of [
    ['left', left],
    ['right', right],
  ] as const) {
    column.sort((a, b) => a.anchor.y - b.anchor.y);
    const ys: number[] = [];
    let next = top;
    for (const item of column) {
      const y = Math.max(item.anchor.y, next);
      ys.push(y);
      next = y + gap;
    }
    const overflow = (ys.at(-1) ?? bottom) - bottom;
    column.forEach((item, i) => {
      const y = ys[i]! - Math.max(0, overflow);
      const tickOut = arcPoint(item.fraction, outer + TICK_OUT, geometry);
      const edge = side === 'left' ? margin + labelWidth : width - margin - labelWidth;
      const towards = Math.min(ELBOW_REACH, Math.abs(tickOut.y - y));
      // The slanted part never runs into the label column.
      const elbowX =
        side === 'left'
          ? Math.min(tickOut.x, Math.max(edge, tickOut.x - towards))
          : Math.max(tickOut.x, Math.min(edge, tickOut.x + towards));
      placed.push({
        index: item.index,
        fraction: item.fraction,
        side,
        y,
        tick: [
          arcPoint(item.fraction, geometry.r - geometry.band / 2 - TICK_IN, geometry),
          tickOut,
        ],
        elbow: { x: elbowX, y },
        end: { x: edge, y },
        textX: side === 'left' ? margin : width - margin,
      });
    });
  }
  return placed.sort((a, b) => a.index - b.index);
}
