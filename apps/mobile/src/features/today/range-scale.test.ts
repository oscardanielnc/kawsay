import { RANGE_ZONES } from '@kawsay/core/day/range-state';
import { TRACK_STOPS, trackPosition } from './range-scale';

const calories = RANGE_ZONES.calories;

describe('trackPosition (range rows: every zone keeps its own width)', () => {
  it('the green limits sit at fixed points far apart, whatever the metric', () => {
    for (const zone of Object.values(RANGE_ZONES)) {
      expect(trackPosition(zone.greenFrom, zone)).toBeCloseTo(TRACK_STOPS.greenFrom, 10);
      expect(trackPosition(zone.greenTo, zone)).toBeCloseTo(TRACK_STOPS.greenTo, 10);
    }
    expect(TRACK_STOPS.greenTo - TRACK_STOPS.greenFrom).toBeGreaterThanOrEqual(0.4);
  });

  it('calories: 100% of the target is the middle of the green zone', () => {
    expect(trackPosition(100, calories)).toBeCloseTo(0.5, 10);
  });

  it('is linear inside each zone: 85% is halfway through the low yellow', () => {
    const middle = (TRACK_STOPS.yellowFrom + TRACK_STOPS.greenFrom) / 2;
    expect(trackPosition(85, calories)).toBeCloseTo(middle, 10);
  });

  it('starts at 0 for nothing eaten and stops at the end far above the target', () => {
    expect(trackPosition(0, calories)).toBe(0);
    expect(trackPosition(500, calories)).toBe(1);
  });
});
