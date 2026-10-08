import { dayLogged } from './day-logged';

const nothing = {
  mealSlotsWithEntries: 0,
  activityCount: 0,
  noActivity: false,
  weighedToday: false,
};

describe('dayLogged: the six parts of the outer ring (design S2)', () => {
  it('an empty day has nothing done', () => {
    expect(dayLogged(nothing)).toEqual({
      areas: {
        meals: false,
        activity: false,
        water: false,
        body: false,
        sleep: false,
        weight: false,
      },
      done: 0,
    });
  });

  it('meals count from two meals logged', () => {
    expect(dayLogged({ ...nothing, mealSlotsWithEntries: 1 }).areas.meals).toBe(false);
    expect(dayLogged({ ...nothing, mealSlotsWithEntries: 2 }).areas.meals).toBe(true);
  });

  it('activity counts with an activity or with "No physical activity"', () => {
    expect(dayLogged({ ...nothing, activityCount: 1 }).areas.activity).toBe(true);
    expect(dayLogged({ ...nothing, noActivity: true }).areas.activity).toBe(true);
  });

  it('weight counts when the day has its weigh-in', () => {
    expect(dayLogged({ ...nothing, weighedToday: true })).toMatchObject({
      areas: { weight: true },
      done: 1,
    });
  });
});
