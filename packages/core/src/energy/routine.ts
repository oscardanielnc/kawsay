import { assertAtLeast, assertPositive } from '../shared/assert';
import { activityKcal, metForIntensity, type Intensity } from './activity';

/** Default rest between sets of a routine (F18). */
export const DEFAULT_REST_SECONDS = 75;

interface Repetitions {
  sets: number;
  reps: number;
  secondsPerRep: number;
  intensity: Intensity;
  perSide?: boolean;
}

export type Exercise =
  | ({ kind: 'weights' } & Repetitions)
  | ({ kind: 'bodyweight' } & Repetitions)
  /** Non-stop bodyweight cardio: timed like bodyweight, with the circuit-training METs. */
  | ({ kind: 'circuit' } & Repetitions)
  | { kind: 'isometric'; sets: number; seconds: number; intensity?: Intensity; perSide?: boolean }
  | { kind: 'stairs'; laps: number; lapSeconds: number; intensity?: Intensity }
  | { kind: 'mobility'; minutes: number; intensity?: Intensity };

type CompendiumEntry = { met: number; code: string };

/** 2024 Adult Compendium values per kind (F18). */
type ByIntensityKind = 'weights' | 'bodyweight' | 'circuit';
const BY_INTENSITY: Record<ByIntensityKind, Record<Intensity, CompendiumEntry>> = {
  weights: {
    light: { met: 3.5, code: '02054' },
    medium: { met: 5.0, code: '02052' },
    hard: { met: 6.0, code: '02050' },
  },
  bodyweight: {
    light: { met: 3.0, code: '02056' },
    medium: { met: 3.8, code: '02022' },
    hard: { met: 6.5, code: '02057' },
  },
  circuit: {
    light: { met: 3.5, code: '02034' },
    medium: { met: 5.0, code: '02035' },
    hard: { met: 6.0, code: '02032' },
  },
};

const SINGLE_CODE: Record<'isometric' | 'stairs' | 'mobility', CompendiumEntry> = {
  isometric: { met: 2.8, code: '02024' },
  stairs: { met: 7.5, code: '17138' },
  mobility: { met: 2.3, code: '02101' },
};

export interface ExerciseEnergy {
  minutes: number;
  kcal: number;
  met: number;
  code: string;
}

function workSeconds(exercise: Exercise, restSeconds: number): number {
  switch (exercise.kind) {
    case 'weights':
    case 'bodyweight':
    case 'circuit': {
      const { sets, reps, secondsPerRep, perSide } = exercise;
      assertPositive({ sets, reps, secondsPerRep });
      return sets * (reps * secondsPerRep * (perSide ? 2 : 1) + restSeconds);
    }
    case 'isometric': {
      const { sets, seconds, perSide } = exercise;
      assertPositive({ sets, seconds });
      return sets * (seconds * (perSide ? 2 : 1) + restSeconds);
    }
    case 'stairs':
      assertPositive({ laps: exercise.laps, lapSeconds: exercise.lapSeconds });
      return exercise.laps * exercise.lapSeconds;
    case 'mobility':
      assertPositive({ minutes: exercise.minutes });
      return exercise.minutes * 60;
  }
}

function compendium(exercise: Exercise): CompendiumEntry {
  if (
    exercise.kind === 'weights' ||
    exercise.kind === 'bodyweight' ||
    exercise.kind === 'circuit'
  ) {
    return BY_INTENSITY[exercise.kind][exercise.intensity];
  }
  const entry = SINGLE_CODE[exercise.kind];
  return exercise.intensity
    ? { ...entry, met: metForIntensity(entry.met, exercise.intensity) }
    : entry;
}

/** Minutes and kcal above rest of one exercise; rests count (F18). */
export function exerciseEnergy(
  exercise: Exercise,
  { restSeconds, bmrKcal }: { restSeconds: number; bmrKcal: number },
): ExerciseEnergy {
  assertAtLeast(0, { restSeconds });
  const seconds = workSeconds(exercise, restSeconds);
  const { met, code } = compendium(exercise);
  return {
    minutes: seconds / 60,
    kcal: activityKcal({ met, hours: seconds / 3600, bmrKcal }),
    met,
    code,
  };
}

/** A logged session: the routine's total scaled by how much was done (F18: 100 / 75 / 50 / 25%). */
export function routineSessionEnergy({
  exercises,
  restSeconds,
  bmrKcal,
  completion,
}: {
  exercises: readonly Exercise[];
  restSeconds: number;
  bmrKcal: number;
  completion: number;
}): { minutes: number; kcal: number } {
  if (!(completion > 0 && completion <= 1)) {
    throw new RangeError(`completion must be in (0, 1], got ${completion}`);
  }
  const total = exercises
    .map((exercise) => exerciseEnergy(exercise, { restSeconds, bmrKcal }))
    .reduce((sum, e) => ({ minutes: sum.minutes + e.minutes, kcal: sum.kcal + e.kcal }), {
      minutes: 0,
      kcal: 0,
    });
  return { minutes: total.minutes * completion, kcal: total.kcal * completion };
}

/** Rounds a routine "by rounds" can be logged with: ½ to 6 in halves (F18). */
export const ROUND_CHOICES: readonly number[] = Array.from({ length: 12 }, (_, i) => (i + 1) / 2);

/** A routine defined as one round, logged by rounds done: its minutes and kcal multiply by the rounds (F18). */
export function roundsSessionEnergy({
  exercises,
  restSeconds,
  bmrKcal,
  rounds,
}: {
  exercises: readonly Exercise[];
  restSeconds: number;
  bmrKcal: number;
  rounds: number;
}): { minutes: number; kcal: number } {
  if (!ROUND_CHOICES.includes(rounds)) {
    throw new RangeError(`rounds must be ½ to 6 in halves, got ${rounds}`);
  }
  const one = routineSessionEnergy({ exercises, restSeconds, bmrKcal, completion: 1 });
  return { minutes: one.minutes * rounds, kcal: one.kcal * rounds };
}

/** "Adjust per exercise" (F18): the sets, laps or minutes actually done replace the planned ones. */
export function withDone(exercise: Exercise, done: number): Exercise {
  switch (exercise.kind) {
    case 'stairs':
      return { ...exercise, laps: done };
    case 'mobility':
      return { ...exercise, minutes: done };
    default:
      return { ...exercise, sets: done };
  }
}

/**
 * Time-weighted MET of a session: 1 + Σ((MET − 1) × time) ÷ Σ time. A session stored as one block with this MET has
 * the same kcal as its exercises added one by one, and keeps them when the routine is edited later (F18).
 */
export function equivalentMet(energies: readonly ExerciseEnergy[]): number {
  const minutes = energies.reduce((sum, e) => sum + e.minutes, 0);
  if (minutes === 0) return 1;
  return 1 + energies.reduce((sum, e) => sum + (e.met - 1) * e.minutes, 0) / minutes;
}
