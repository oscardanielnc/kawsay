import { activityKcal } from '@kawsay/core/energy/activity';
import type { Routine } from './routines-db';
import { plannedAmount, routineTotals, sessionOf } from './session';

const bmrKcal = 1717.5;
const routine: Routine = {
  id: 'r1',
  name: 'Fuerza A + escaleras',
  restSeconds: 75,
  exercises: [
    {
      name: 'Sentadilla',
      exercise: { kind: 'weights', sets: 3, reps: 15, secondsPerRep: 4, intensity: 'light' },
    },
    { name: 'Escaleras', exercise: { kind: 'stairs', laps: 4, lapSeconds: 70 } },
  ],
};

describe('routine sessions (F18)', () => {
  it('logging a routine at 75% records 75% of its minutes and calories', () => {
    const full = sessionOf(routine, { completion: 1 }, bmrKcal);
    const partial = sessionOf(routine, { completion: 0.75 }, bmrKcal);
    expect(partial.minutes).toBeCloseTo(full.minutes * 0.75, 10);
    expect(partial.kcal).toBeCloseTo(full.kcal * 0.75, 10);
  });

  it('adjusting stairs from 4 to 6 laps adds 2 × lap time at MET 7.5', () => {
    const planned = sessionOf(routine, { done: [3, 4] }, bmrKcal);
    const more = sessionOf(routine, { done: [3, 6] }, bmrKcal);
    expect(more.minutes - planned.minutes).toBeCloseTo((2 * 70) / 60, 10);
    expect(more.kcal - planned.kcal).toBeCloseTo(
      activityKcal({ met: 7.5, hours: 140 / 3600, bmrKcal }),
      10,
    );
  });

  it('the stored block (minutes + equivalent MET) reproduces the session kcal', () => {
    const session = sessionOf(routine, { completion: 1 }, bmrKcal);
    expect(activityKcal({ met: session.met, hours: session.minutes / 60, bmrKcal })).toBeCloseTo(
      session.kcal,
      10,
    );
  });

  it('the planned amount per exercise is its sets, laps or minutes', () => {
    expect(routine.exercises.map((e) => plannedAmount(e.exercise))).toEqual([3, 4]);
  });

  it('routine totals for the editor: kcal and minutes', () => {
    const totals = routineTotals(routine, bmrKcal);
    expect(totals.minutes).toBeCloseTo((3 * (15 * 4 + 75) + 4 * 70) / 60, 10);
    expect(totals.perExercise).toHaveLength(2);
  });
});
