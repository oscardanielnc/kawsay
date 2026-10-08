import {
  equivalentMet,
  exerciseEnergy,
  withDone,
  type Exercise,
  type ExerciseEnergy,
} from '@kawsay/core/energy/routine';
import type { Routine } from './routines-db';

/** Sets, laps or minutes the routine plans for an exercise: what "adjust per exercise" edits. */
export function plannedAmount(exercise: Exercise): number {
  if (exercise.kind === 'stairs') return exercise.laps;
  if (exercise.kind === 'mobility') return exercise.minutes;
  return exercise.sets;
}

/** Energy of every exercise and the routine total, for the editor (F18). */
export function routineTotals(routine: Routine, bmrKcal: number) {
  const perExercise = routine.exercises.map(({ exercise }) =>
    exerciseEnergy(exercise, { restSeconds: routine.restSeconds, bmrKcal }),
  );
  return {
    perExercise,
    minutes: perExercise.reduce((sum, e) => sum + e.minutes, 0),
    kcal: perExercise.reduce((sum, e) => sum + e.kcal, 0),
  };
}

/**
 * A logged session: by share done (100 / 75 / 50 / 25 %) or by the amount done per exercise. Stored as one block
 * of minutes and equivalent MET, so editing the routine later never changes it (F18).
 */
export function sessionOf(
  routine: Routine,
  how: { completion: number } | { done: readonly number[] },
  bmrKcal: number,
): { minutes: number; met: number; kcal: number } {
  const energies: ExerciseEnergy[] = routine.exercises.flatMap(({ exercise }, i) => {
    const amount = 'done' in how ? (how.done[i] ?? 0) : plannedAmount(exercise) * how.completion;
    if (amount <= 0) return [];
    return [
      exerciseEnergy(withDone(exercise, amount), { restSeconds: routine.restSeconds, bmrKcal }),
    ];
  });
  return {
    minutes: energies.reduce((sum, e) => sum + e.minutes, 0),
    met: equivalentMet(energies),
    kcal: energies.reduce((sum, e) => sum + e.kcal, 0),
  };
}
