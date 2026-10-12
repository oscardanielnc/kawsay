import { RANGE_ZONES } from '@kawsay/core/day/range-state';
import { TRACK_STOPS, trackPosition } from './range-scale';

const calories = RANGE_ZONES.calories;

describe('trackPosition (range gauges: zones in sevenths)', () => {
  it('the zone limits sit at 2/7, 3/7, 4/7 and 5/7 of the arc, whatever the metric', () => {
    expect(TRACK_STOPS).toEqual({
      yellowFrom: 2 / 7,
      greenFrom: 3 / 7,
      greenTo: 4 / 7,
      yellowTo: 5 / 7,
    });
    for (const zone of Object.values(RANGE_ZONES)) {
      expect(trackPosition(zone.greenFrom, zone)).toBeCloseTo(3 / 7, 10);
      expect(trackPosition(zone.greenTo, zone)).toBeCloseTo(4 / 7, 10);
    }
  });

  it('calories: 100% of the target is the middle of the arc', () => {
    expect(trackPosition(100, calories)).toBeCloseTo(0.5, 10);
  });

  it('is linear inside each zone: 85% is halfway through the low yellow', () => {
    expect(trackPosition(85, calories)).toBeCloseTo(2.5 / 7, 10);
  });

  it('starts at 0 for nothing eaten and stops at the end far above the target', () => {
    expect(trackPosition(0, calories)).toBe(0);
    expect(trackPosition(500, calories)).toBe(1);
  });
});
