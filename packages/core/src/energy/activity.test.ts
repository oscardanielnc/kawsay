import { describe, expect, it } from 'vitest';
import { activityKcal, dayActivityKcal, metForIntensity } from './activity';

const bmrKcal = 1717.5; // male, 30 y, 170 cm, 80 kg

describe('activityKcal: (MET − 1) × (BMR / 24) × hours × 1.10', () => {
  it('30 min of stairs (MET 6.8) adds ≈ 228 kcal above rest', () => {
    expect(activityKcal({ met: 6.8, hours: 0.5, bmrKcal })).toBeCloseTo(228.28, 2);
  });

  it('MET 1 is rest: nothing above the BMR', () => {
    expect(activityKcal({ met: 1, hours: 8, bmrKcal })).toBe(0);
  });

  it.each([
    { met: 0.9, hours: 1 },
    { met: 3, hours: -1 },
  ])('rejects a MET below rest or negative hours: %o', (block) => {
    expect(() => activityKcal({ ...block, bmrKcal })).toThrow(RangeError);
  });
});

describe('metForIntensity: a single Compendium code scales ±20%', () => {
  it.each([
    ['light', 2.4],
    ['medium', 3],
    ['hard', 3.6],
  ] as const)('%s → MET %d', (intensity, met) => {
    expect(metForIntensity(3, intensity)).toBeCloseTo(met, 10);
  });
});

describe('dayActivityKcal: unlogged waking hours count as "Sitting and short walks" (MET 1.4)', () => {
  it('a day with nothing logged and 16 waking hours adds ≈ 504 kcal', () => {
    expect(dayActivityKcal({ bmrKcal, wakingHours: 16, blocks: [] })).toBeCloseTo(503.8, 1);
  });

  it('logging 30 min of stairs replaces 30 min of the baseline and raises the day (F08)', () => {
    const base = dayActivityKcal({ bmrKcal, wakingHours: 16, blocks: [] });
    const withStairs = dayActivityKcal({
      bmrKcal,
      wakingHours: 16,
      blocks: [{ met: 6.8, hours: 0.5 }],
    });
    expect(withStairs - base).toBeCloseTo(((6.8 - 1.4) * bmrKcal * 0.5 * 1.1) / 24, 6);
  });

  it('a block with computed kcal (a routine session) adds them as they are', () => {
    const base = dayActivityKcal({ bmrKcal, wakingHours: 16, blocks: [] });
    const withRoutine = dayActivityKcal({
      bmrKcal,
      wakingHours: 16,
      blocks: [{ hours: 0.5, kcal: 150 }],
    });
    expect(withRoutine - base).toBeCloseTo(
      150 - activityKcal({ met: 1.4, hours: 0.5, bmrKcal }),
      10,
    );
  });

  it('logged hours beyond the waking hours leave no negative baseline', () => {
    expect(dayActivityKcal({ bmrKcal, wakingHours: 1, blocks: [{ met: 3, hours: 2 }] })).toBe(
      activityKcal({ met: 3, hours: 2, bmrKcal }),
    );
  });
});
