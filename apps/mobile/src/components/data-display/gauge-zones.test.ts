import {
  needleAngle,
  oneSidedPosition,
  twoSidedPosition,
  ZONE_PATHS,
  ZONES,
  zoneAt,
} from './gauge-zones';

describe('Amanecer gauge (design M3)', () => {
  it('two-sided zones are coral 10 · amber 18 · blue 44 · amber 18 · coral 10 %', () => {
    expect(ZONES['two-sided'].map((z) => [z.zone, z.to])).toEqual([
      ['far', 0.1],
      ['near', 0.28],
      ['in', 0.72],
      ['near', 0.9],
      ['far', 1],
    ]);
    expect(ZONE_PATHS['two-sided']).toHaveLength(5);
  });

  it('one-sided zones are blue 3/7 · amber 2/7 · coral 2/7', () => {
    expect(ZONES['one-sided'].map((z) => [z.zone, z.to])).toEqual([
      ['in', 3 / 7],
      ['near', 5 / 7],
      ['far', 1],
    ]);
    expect(ZONE_PATHS['one-sided']).toHaveLength(3);
  });

  it('value → needle angle: 0 left, half up, 1 right, clamped outside', () => {
    expect(needleAngle(0)).toBe(0);
    expect(needleAngle(0.5)).toBe(90);
    expect(needleAngle(1)).toBe(180);
    expect(needleAngle(-0.2)).toBe(0);
    expect(needleAngle(1.4)).toBe(180);
  });

  it('a two-sided value sits on its zone by the range thresholds: calories 90–110 % blue', () => {
    const calories = { yellowFrom: 80, greenFrom: 90, greenTo: 110, yellowTo: 120 };
    expect(twoSidedPosition(90, calories)).toBeCloseTo(0.28, 10);
    expect(twoSidedPosition(110, calories)).toBeCloseTo(0.72, 10);
    expect(zoneAt(twoSidedPosition(100, calories), 'two-sided')).toBe('in');
    expect(zoneAt(twoSidedPosition(115, calories), 'two-sided')).toBe('near');
    expect(zoneAt(twoSidedPosition(130, calories), 'two-sided')).toBe('far');
    expect(zoneAt(twoSidedPosition(70, calories), 'two-sided')).toBe('far');
    expect(twoSidedPosition(0, calories)).toBe(0);
  });

  it('a one-sided value is blue up to its ideal, amber up to its max, coral above', () => {
    expect(zoneAt(oneSidedPosition(14, 21, 42), 'one-sided')).toBe('in');
    expect(zoneAt(oneSidedPosition(21, 21, 42), 'one-sided')).toBe('in');
    expect(zoneAt(oneSidedPosition(30, 21, 42), 'one-sided')).toBe('near');
    expect(zoneAt(oneSidedPosition(50, 21, 42), 'one-sided')).toBe('far');
    expect(oneSidedPosition(0, 21, 42)).toBe(0);
  });
});
