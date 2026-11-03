import { describe, expect, it } from 'vitest';
import { RANGE_ZONES } from '../day/range-state';
import { layoutLabels, type GaugeGeometry, type PlacedLabel, type Point } from './label-layout';
import { oneSidedScale, twoSidedScale, type GaugeScale } from './scale';

/** The big gauge of the detail sheet (design/explorations/2026-11-01-gauge-detail.html). */
const G: GaugeGeometry = { cx: 179, cy: 156, r: 92, band: 22 };
const LABEL_H = 16;
const LABEL_W = 64;
const MARGIN = 6;

/** The limits between two zones, as fractions of the arc. */
const limits = (scale: GaugeScale) => scale.zones.slice(1).map((z) => z.from);

const KINDS: [string, GaugeScale][] = [
  ['calories 2,000', twoSidedScale(2000, RANGE_ZONES.calories)],
  ['calories 1,200', twoSidedScale(1200, RANGE_ZONES.calories)],
  ['calories 4,500', twoSidedScale(4500, RANGE_ZONES.calories)],
  ['protein 40 g', twoSidedScale(40, RANGE_ZONES.protein)],
  ['protein 220 g', twoSidedScale(220, RANGE_ZONES.protein)],
  ['fat 55.6 g', twoSidedScale(55.6, RANGE_ZONES.fat)],
  ['carbs 500 g', twoSidedScale(500, RANGE_ZONES.carbs)],
  ['added sugar 1,200 kcal', oneSidedScale(15, 30)],
  ['refined flours, 10% limit', oneSidedScale(13, 19.5)],
  ['refined flours, 100% limit', oneSidedScale(500, 750)],
];

const box = (p: PlacedLabel) => {
  const x0 = p.side === 'left' ? MARGIN : G.cx * 2 - MARGIN - LABEL_W;
  return { x0, x1: x0 + LABEL_W, y0: p.y - LABEL_H / 2, y1: p.y + LABEL_H / 2 };
};

/** Least distance from the gauge centre to a box. */
const nearest = (b: ReturnType<typeof box>) => {
  const x = Math.min(Math.max(G.cx, b.x0), b.x1);
  const y = Math.min(Math.max(G.cy, b.y0), b.y1);
  return Math.hypot(x - G.cx, y - G.cy);
};

const cross = (a: Point, b: Point, c: Point, d: Point) => {
  const turn = (p: Point, q: Point, r: Point) =>
    Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0;
};
const segments = (p: PlacedLabel): [Point, Point][] => [
  [p.tick[1], p.elbow],
  [p.elbow, p.end],
];

describe('layoutLabels: side columns for the limits of the big gauge (F26)', () => {
  it('2,000 kcal: 1,600 (the top) on the emptier left side, 1,800 · 2,200 · 2,400 on the right in arc order', () => {
    const scale = twoSidedScale(2000, RANGE_ZONES.calories);
    const placed = layoutLabels(limits(scale), G);
    expect(placed.map((p) => p.side)).toEqual(['left', 'right', 'right', 'right']);
    expect(placed[1]!.y).toBeLessThan(placed[2]!.y);
    expect(placed[2]!.y).toBeLessThan(placed[3]!.y);
  });

  it('a limit near the top goes to the emptier side', () => {
    const placed = layoutLabels([0.3, 0.51], G);
    expect(placed.map((p) => p.side)).toEqual(['left', 'right']);
    expect(layoutLabels([0.7, 0.49], G).map((p) => p.side)).toEqual(['right', 'left']);
  });

  it('labels of one column are pushed up together when they would pass the bottom', () => {
    const placed = layoutLabels([0.02, 0.04, 0.06], G);
    expect(Math.max(...placed.map((p) => p.y))).toBeLessThanOrEqual(G.cy - 26);
  });

  describe.each(KINDS)('%s', (_name, scale) => {
    const placed = layoutLabels(limits(scale), G, { labelWidth: LABEL_W, margin: MARGIN });

    it('no two labels of a column are closer than 30', () => {
      for (const side of ['left', 'right'] as const) {
        const ys = placed
          .filter((p) => p.side === side)
          .map((p) => p.y)
          .sort((a, b) => a - b);
        ys.slice(1).forEach((y, i) => expect(y - ys[i]!).toBeGreaterThanOrEqual(30 - 1e-9));
      }
    });

    it('no label touches the arc band or the needle', () => {
      for (const p of placed) expect(nearest(box(p))).toBeGreaterThan(G.r + G.band / 2);
    });

    it('labels stay inside the drawing, above the end labels', () => {
      for (const p of placed) {
        expect(box(p).y0).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(G.cy - 26);
      }
    });

    it('leaders never cross', () => {
      for (const a of placed)
        for (const b of placed)
          if (a.index < b.index)
            for (const [p, q] of segments(a))
              for (const [r, s] of segments(b)) expect(cross(p, q, r, s)).toBe(false);
    });
  });
});
