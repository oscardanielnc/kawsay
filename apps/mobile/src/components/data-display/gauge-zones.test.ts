import { RANGE_ZONES } from '@kawsay/core/day/range-state';
import { oneSidedScale, twoSidedScale } from '@kawsay/core/gauge/scale';
import { needleAngle, zoneDegrees, zonePaths } from './gauge-zones';

const round = ([from, to]: [number, number]) => [
  Math.round(from * 10) / 10,
  Math.round(to * 10) / 10,
];

describe('Amanecer gauge at real scale (ADR 0027)', () => {
  it('2,000 kcal draws coral to 1,600, amber to 1,800, blue to 2,200, amber to 2,400, coral to 3,200', () => {
    const zones = twoSidedScale(2000, RANGE_ZONES.calories).zones;
    // 0–3,200 over 180°: 1,600 → 90°, 1,800 → 101.25°, 2,200 → 123.75°, 2,400 → 135°; a 4.3° gap between zones
    expect(zones.map(zoneDegrees).map(round)).toEqual([
      [0, 87.9],
      [92.2, 99.1],
      [103.4, 121.6],
      [125.9, 132.9],
      [137.2, 180],
    ]);
    expect(zones.map((z) => z.tone)).toEqual(['red', 'yellow', 'green', 'yellow', 'red']);
  });

  it('every zone becomes one arc path from the left end to the right end', () => {
    // Sugar in thirds: blue ends at 60° minus half a gap (57.85°)
    const paths = zonePaths(oneSidedScale(25, 50).zones);
    expect(paths).toHaveLength(3);
    expect(paths[0]).toBe('M 22.0 100.0 A 78 78 0 0 1 58.5 34.0');
    expect(paths[2]).toMatch(/A 78 78 0 0 1 178\.0 100\.0$/);
  });

  it('a zone thinner than the gap still draws 1°', () => {
    const [from, to] = zoneDegrees({ from: 0.5, to: 0.51, tone: 'yellow' });
    expect(to - from).toBeCloseTo(1);
  });

  it('value → needle angle: 0 left, half up, 1 right, clamped outside', () => {
    expect(needleAngle(0)).toBe(0);
    expect(needleAngle(0.5)).toBe(90);
    expect(needleAngle(1)).toBe(180);
    expect(needleAngle(-0.2)).toBe(0);
    expect(needleAngle(1.4)).toBe(180);
  });
});
