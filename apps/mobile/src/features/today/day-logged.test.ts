import { dayLogged } from './day-logged';

const nothing = {
  mealSlotsWithEntries: 0,
  activityCount: 0,
  noActivity: false,
  weighedToday: false,
  urineNoted: false,
  bathroomNoted: false,
  bodyAnswers: 0,
  sleepSessions: 0,
  sleepRated: 0,
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

  it('water counts with the urine colour alone: drinks are optional (F10)', () => {
    expect(dayLogged(nothing).areas.water).toBe(false);
    expect(dayLogged({ ...nothing, urineNoted: true }).areas.water).toBe(true);
  });

  it('body and mood count with the bathroom (or “didn’t go”) plus stress, energy and mood, no bloating', () => {
    expect(dayLogged({ ...nothing, bodyAnswers: 3 }).areas.body).toBe(false);
    expect(dayLogged({ ...nothing, bodyAnswers: 3, bathroomNoted: true }).areas.body).toBe(true);
  });

  it('sleep counts when every session has its quality', () => {
    expect(dayLogged({ ...nothing, sleepSessions: 2, sleepRated: 1 }).areas.sleep).toBe(false);
    expect(dayLogged({ ...nothing, sleepSessions: 2, sleepRated: 2 }).areas.sleep).toBe(true);
  });
});
