import { GAUGE_COLORS, gaugeColorAt, gaugePoint, type GaugeBand } from './gauge';

const TWO_SIDED: readonly GaugeBand[] = [
  { to: 2 / 7, tone: 'red' },
  { to: 3 / 7, tone: 'yellow' },
  { to: 4 / 7, tone: 'green' },
  { to: 5 / 7, tone: 'yellow' },
  { to: 1, tone: 'red' },
];

describe('arc gauge', () => {
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

  it('0 is the left end of the arc, 1 the right end, 0.5 the top', () => {
    const c = { cx: 100, cy: 100 };
    expect(gaugePoint(0, 50, c).x).toBeCloseTo(50, 10);
    expect(gaugePoint(1, 50, c).x).toBeCloseTo(150, 10);
    const top = gaugePoint(0.5, 50, c);
    expect(top.x).toBeCloseTo(100, 10);
    expect(top.y).toBeCloseTo(50, 10);
  });
});
