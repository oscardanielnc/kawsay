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
  | { kind: 'isometric'; sets: number; seconds: number; intensity?: Intensity; perSide?: boolean }
  | { kind: 'stairs'; laps: number; lapSeconds: number; intensity?: Intensity }
  | { kind: 'mobility'; minutes: number; intensity?: Intensity };

type CompendiumEntry = { met: number; code: string };

/** 2024 Adult Compendium values per kind (F18). */
const BY_INTENSITY: Record<'weights' | 'bodyweight', Record<Intensity, CompendiumEntry>> = {
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
    case 'bodyweight': {
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
  if (exercise.kind === 'weights' || exercise.kind === 'bodyweight') {
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
