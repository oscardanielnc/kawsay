import { GAUGE_COLORS, gaugeColorAt, gaugePoint, piecewise, TWO_SIDED, UPPER_LIMIT } from './gauge';

describe('arc gauge', () => {
  it('two-sided gauges split the arc in 7 parts: red 2 · yellow 1 · green 1 · yellow 1 · red 2', () => {
    expect(TWO_SIDED.map((b) => [b.tone, b.to])).toEqual([
      ['red', 2 / 7],
      ['yellow', 3 / 7],
      ['green', 4 / 7],
      ['yellow', 5 / 7],
      ['red', 1],
    ]);
  });

  it('upper-limit gauges (sugar, waist): green 3 · yellow 2 · red 2', () => {
    expect(UPPER_LIMIT.map((b) => [b.tone, b.to])).toEqual([
      ['green', 3 / 7],
      ['yellow', 5 / 7],
      ['red', 1],
    ]);
  });

  it('pastel red at both ends, green in the middle', () => {
    expect(gaugeColorAt(0, TWO_SIDED)).toBe(GAUGE_COLORS.red);
    expect(gaugeColorAt(1, TWO_SIDED)).toBe(GAUGE_COLORS.red);
    expect(gaugeColorAt(0.5, TWO_SIDED)).toBe(GAUGE_COLORS.green);
  });

  it('blends softly across a zone limit instead of a hard change', () => {
    const edge = gaugeColorAt(3 / 7, TWO_SIDED);
    expect(edge).not.toBe(GAUGE_COLORS.yellow);
    expect(edge).not.toBe(GAUGE_COLORS.green);
  });

  it('piecewise is linear inside each segment and clamps outside', () => {
    const points: [number, number][] = [
      [0, 0],
      [10, 0.5],
      [30, 1],
    ];
    expect(piecewise(5, points)).toBeCloseTo(0.25, 10);
    expect(piecewise(20, points)).toBeCloseTo(0.75, 10);
    expect(piecewise(-3, points)).toBe(0);
    expect(piecewise(99, points)).toBe(1);
  });

  it('0 is the left end of the arc, 1 the right end, 0.5 the top', () => {
    const c = { cx: 100, cy: 100 };
    expect(gaugePoint(0, 50, c).x).toBeCloseTo(50, 10);
    expect(gaugePoint(1, 50, c).x).toBeCloseTo(150, 10);
    const top = gaugePoint(0.5, 50, c);
    expect(top.x).toBeCloseTo(100, 10);
    expect(top.y).toBeCloseTo(50, 10);
  });
});
