import { describe, expect, it } from 'vitest';
import { activityKcal } from './activity';
import {
  equivalentMet,
  exerciseEnergy,
  ROUND_CHOICES,
  roundsSessionEnergy,
  routineSessionEnergy,
  withDone,
  type Exercise,
} from './routine';

const bmrKcal = 1717.5;
const restSeconds = 75;

describe('exerciseEnergy: time by kind, kcal by the net MET formula (F18)', () => {
  it('weights, medium: 3 × (10 reps × 3 s + 75 s rest) = 5.25 min at MET 5.0 (02052)', () => {
    const result = exerciseEnergy(
      { kind: 'weights', sets: 3, reps: 10, secondsPerRep: 3, intensity: 'medium' },
      { restSeconds, bmrKcal },
    );
    expect(result).toMatchObject({ minutes: 5.25, met: 5, code: '02052' });
    expect(result.kcal).toBeCloseTo(activityKcal({ met: 5, hours: 5.25 / 60, bmrKcal }), 10);
  });

  it.each([
    ['light', 3.0, '02056'],
    ['medium', 3.8, '02022'],
    ['hard', 6.5, '02057'],
  ] as const)('bodyweight, %s → MET %d (%s)', (intensity, met, code) => {
    const result = exerciseEnergy(
      { kind: 'bodyweight', sets: 1, reps: 10, secondsPerRep: 2, intensity },
      { restSeconds, bmrKcal },
    );
    expect(result).toMatchObject({ met, code });
  });

  it('"per side" doubles the work time, not the rest', () => {
    const lunges: Exercise = {
      kind: 'bodyweight',
      sets: 2,
      reps: 10,
      secondsPerRep: 2,
      intensity: 'medium',
      perSide: true,
    };
    expect(exerciseEnergy(lunges, { restSeconds, bmrKcal }).minutes).toBeCloseTo(
      (2 * (10 * 2 * 2 + 75)) / 60,
      10,
    );
  });

  it('isometric plank: 3 × (45 s + 75 s rest) = 6 min at MET 2.8 (02024)', () => {
    expect(
      exerciseEnergy({ kind: 'isometric', sets: 3, seconds: 45 }, { restSeconds, bmrKcal }),
    ).toMatchObject({ minutes: 6, met: 2.8, code: '02024' });
  });

  it('mobility: the minutes as given at MET 2.3 (02101)', () => {
    expect(
      exerciseEnergy({ kind: 'mobility', minutes: 10 }, { restSeconds, bmrKcal }),
    ).toMatchObject({ minutes: 10, met: 2.3, code: '02101' });
  });

  it('a single-code kind scales its MET ±20% when an effort is given', () => {
    const hardPlank = exerciseEnergy(
      { kind: 'isometric', sets: 1, seconds: 60, intensity: 'hard' },
      { restSeconds, bmrKcal },
    );
    expect(hardPlank.met).toBeCloseTo(2.8 * 1.2, 10);
  });

  it('adjusting stairs from 4 to 6 laps adds 2 × lap time at MET 7.5 (F18)', () => {
    const lapSeconds = 50;
    const four = exerciseEnergy({ kind: 'stairs', laps: 4, lapSeconds }, { restSeconds, bmrKcal });
    const six = exerciseEnergy({ kind: 'stairs', laps: 6, lapSeconds }, { restSeconds, bmrKcal });
    expect(six.code).toBe('17138');
    expect(six.minutes - four.minutes).toBeCloseTo((2 * lapSeconds) / 60, 10);
    expect(six.kcal - four.kcal).toBeCloseTo(
      activityKcal({ met: 7.5, hours: (2 * lapSeconds) / 3600, bmrKcal }),
      10,
    );
  });

  it('rejects zero sets, reps or laps', () => {
    expect(() =>
      exerciseEnergy({ kind: 'stairs', laps: 0, lapSeconds: 50 }, { restSeconds, bmrKcal }),
    ).toThrow(RangeError);
  });
});

describe('routineSessionEnergy', () => {
  const exercises: Exercise[] = [
    { kind: 'weights', sets: 3, reps: 10, secondsPerRep: 3, intensity: 'medium' },
    { kind: 'isometric', sets: 3, seconds: 45 },
    { kind: 'stairs', laps: 4, lapSeconds: 50 },
  ];

  it('logging a routine at 75% records 75% of its minutes and calories (F18)', () => {
    const full = routineSessionEnergy({ exercises, restSeconds, bmrKcal, completion: 1 });
    const partial = routineSessionEnergy({ exercises, restSeconds, bmrKcal, completion: 0.75 });
    expect(partial.minutes).toBeCloseTo(full.minutes * 0.75, 10);
    expect(partial.kcal).toBeCloseTo(full.kcal * 0.75, 10);
  });

  it('the full session is the sum of its exercises', () => {
    const full = routineSessionEnergy({ exercises, restSeconds, bmrKcal, completion: 1 });
    const sum = exercises
      .map((exercise) => exerciseEnergy(exercise, { restSeconds, bmrKcal }))
      .reduce((total, e) => total + e.kcal, 0);
    expect(full.kcal).toBeCloseTo(sum, 10);
  });

  it('rejects a completion outside 0–100%', () => {
    expect(() =>
      routineSessionEnergy({ exercises, restSeconds, bmrKcal, completion: 1.25 }),
    ).toThrow(RangeError);
  });
});

describe('circuit: non-stop bodyweight cardio (F18)', () => {
  it.each([
    ['light', 3.5, '02034'],
    ['medium', 5.0, '02035'],
    ['hard', 6.0, '02032'],
  ] as const)('circuit, %s → MET %d (%s)', (intensity, met, code) => {
    const result = exerciseEnergy(
      { kind: 'circuit', sets: 1, reps: 40, secondsPerRep: 1, intensity },
      { restSeconds: 20, bmrKcal },
    );
    expect(result).toMatchObject({ met, code });
  });

  it('measures time like bodyweight: 1 × (10 reps × 2 s × 2 sides + 20 s rest) = 1 min', () => {
    const circuit = exerciseEnergy(
      { kind: 'circuit', sets: 1, reps: 10, secondsPerRep: 2, intensity: 'medium', perSide: true },
      { restSeconds: 20, bmrKcal },
    );
    expect(circuit.minutes).toBe(1);
  });
});

describe('roundsSessionEnergy: routines by rounds (F18)', () => {
  const round: Exercise[] = [
    { kind: 'circuit', sets: 1, reps: 40, secondsPerRep: 1, intensity: 'medium' },
    { kind: 'circuit', sets: 1, reps: 10, secondsPerRep: 4, intensity: 'medium' },
  ];

  it('3 rounds record 3 × the minutes and kcal of one round', () => {
    const one = routineSessionEnergy({ exercises: round, restSeconds: 20, bmrKcal, completion: 1 });
    const three = roundsSessionEnergy({ exercises: round, restSeconds: 20, bmrKcal, rounds: 3 });
    expect(three.minutes).toBeCloseTo(one.minutes * 3, 10);
    expect(three.kcal).toBeCloseTo(one.kcal * 3, 10);
  });

  it('rounds go from ½ to 6 in halves', () => {
    expect(ROUND_CHOICES).toEqual([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]);
    for (const rounds of [0, 0.25, 6.5]) {
      expect(() =>
        roundsSessionEnergy({ exercises: round, restSeconds: 20, bmrKcal, rounds }),
      ).toThrow(RangeError);
    }
  });
});

describe('withDone: "adjust per exercise" (F18)', () => {
  it('replaces the sets, laps or minutes actually done', () => {
    expect(withDone({ kind: 'stairs', laps: 4, lapSeconds: 50 }, 6)).toEqual({
      kind: 'stairs',
      laps: 6,
      lapSeconds: 50,
    });
    expect(withDone({ kind: 'isometric', sets: 3, seconds: 45 }, 2)).toMatchObject({ sets: 2 });
    expect(withDone({ kind: 'mobility', minutes: 10 }, 5)).toMatchObject({ minutes: 5 });
  });
});

describe('equivalentMet: a session stored as one block keeps its kcal', () => {
  it('time-weighted MET gives the same kcal as adding the exercises one by one', () => {
    const exercises: Exercise[] = [
      { kind: 'weights', sets: 3, reps: 10, secondsPerRep: 3, intensity: 'medium' },
      { kind: 'stairs', laps: 6, lapSeconds: 50 },
    ];
    const energies = exercises.map((e) => exerciseEnergy(e, { restSeconds, bmrKcal }));
    const minutes = energies.reduce((sum, e) => sum + e.minutes, 0);
    const met = equivalentMet(energies);
    expect(activityKcal({ met, hours: minutes / 60, bmrKcal })).toBeCloseTo(
      energies.reduce((sum, e) => sum + e.kcal, 0),
      10,
    );
  });

  it('no time means rest', () => {
    expect(equivalentMet([])).toBe(1);
  });
});
