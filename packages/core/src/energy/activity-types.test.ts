import { describe, expect, it } from 'vitest';
import { ACTIVITY_TYPES, activityMet } from './activity-types';

describe('activity types (F08, 2024 Adult Compendium)', () => {
  it('has the eight types of the design', () => {
    expect(ACTIVITY_TYPES.map((t) => t.kind)).toEqual([
      'walking',
      'weights',
      'stairs',
      'jogging',
      'motorbike',
      'housework',
      'football',
      'cycling',
    ]);
  });

  it('weights use one Compendium code per intensity: 3.5 / 5.0 / 6.0', () => {
    expect(['light', 'medium', 'hard'].map((i) => activityMet('weights', i as 'light'))).toEqual([
      3.5, 5, 6,
    ]);
  });

  it('stairs have one code (6.8): light and hard scale ±20%', () => {
    expect(activityMet('stairs', 'medium')).toBe(6.8);
    expect(activityMet('stairs', 'light')).toBeCloseTo(5.44, 10);
    expect(activityMet('stairs', 'hard')).toBeCloseTo(8.16, 10);
  });

  it('rejects an unknown type', () => {
    expect(() => activityMet('swimming' as 'walking', 'medium')).toThrow(RangeError);
  });
});
