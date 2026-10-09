import type { Exercise } from '@kawsay/core/energy/routine';
import type { NamedExercise, RoutineInput } from './routines-db';

export interface RoutineTemplate {
  name: string;
  restSeconds: number;
  byRounds: boolean;
  exercises: readonly NamedExercise[];
}

const named = (name: string, exercise: Exercise): NamedExercise => ({ name, exercise });
const reps = (
  kind: 'weights' | 'bodyweight' | 'circuit',
  sets: number,
  count: number,
  secondsPerRep: number,
  intensity: 'light' | 'medium' | 'hard',
  perSide = false,
): Exercise => ({
  kind,
  sets,
  reps: count,
  secondsPerRep,
  intensity,
  ...(perSide && { perSide: true }),
});
const hold = (sets: number, seconds: number, perSide = false): Exercise => ({
  kind: 'isometric',
  sets,
  seconds,
  ...(perSide && { perSide: true }),
});

/** "+ Routine → From a template" (F18): copied one to one from docs/product/routine-templates.md. */
export const ROUTINE_TEMPLATES: readonly RoutineTemplate[] = [
  {
    name: 'Cardio en el cuarto',
    restSeconds: 20,
    byRounds: true,
    exercises: [
      named('Marcha en el sitio', reps('circuit', 1, 40, 1, 'medium')),
      named('Sentadilla a la silla', reps('circuit', 1, 10, 4, 'medium')),
      named('Golpes al aire', reps('circuit', 1, 40, 1, 'medium')),
      named('Paso lateral', reps('circuit', 1, 10, 2, 'medium', true)),
      named('Rodilla al codo de pie', reps('circuit', 1, 10, 2, 'medium', true)),
    ],
  },
  {
    name: 'Fuerza A',
    restSeconds: 75,
    byRounds: false,
    exercises: [
      named('Sentadilla a la silla con mancuerna', reps('weights', 3, 12, 4, 'light')),
      named('Press de suelo, agarre neutro', reps('weights', 3, 15, 3, 'light')),
      named('Remo inclinado', reps('weights', 3, 15, 3, 'light')),
      named('Puente de glúteo con mancuerna', reps('weights', 3, 15, 4, 'light')),
      named('Plancha de antebrazos con rodillas apoyadas', hold(3, 30)),
    ],
  },
  {
    name: 'Fuerza B',
    restSeconds: 75,
    byRounds: false,
    exercises: [
      named('Puente de glúteo a una pierna', reps('bodyweight', 3, 10, 3, 'light', true)),
      named('Peso muerto rumano', reps('weights', 3, 15, 4, 'light')),
      named('Pájaro (elevación posterior)', reps('weights', 3, 15, 3, 'light')),
      named('Bicho muerto', reps('bodyweight', 3, 10, 3, 'light', true)),
      named('Plancha lateral sobre antebrazo', hold(3, 20, true)),
    ],
  },
];

/** A new, fully editable routine copied from a template (no id: saving creates it). */
export function routineFromTemplate(template: RoutineTemplate): RoutineInput {
  return {
    name: template.name,
    restSeconds: template.restSeconds,
    byRounds: template.byRounds,
    exercises: template.exercises.map((e) => ({ name: e.name, exercise: { ...e.exercise } })),
  };
}

const fromTemplates = ROUTINE_TEMPLATES.flatMap((r) => r.exercises);

/**
 * Starting points for "+ Exercise", grouped by kind; every value stays editable. The template exercises come first,
 * then known ones for building new routines later.
 */
export const EXERCISE_TEMPLATES: readonly NamedExercise[] = [
  ...fromTemplates,
  named('Sentadilla goblet', reps('weights', 3, 15, 4, 'light')),
  named('Zancada estática', reps('weights', 3, 10, 3, 'light', true)),
  named('Press de hombros con mancuernas', reps('weights', 3, 12, 3, 'light')),
  named('Curl de bíceps', reps('weights', 3, 12, 3, 'light')),
  named('Extensión de tríceps sobre la cabeza', reps('weights', 3, 12, 3, 'light')),
  named('Elevaciones laterales', reps('weights', 3, 12, 3, 'light')),
  named('Elevación de talones con mancuernas', reps('weights', 3, 15, 2, 'light')),
  named('Flexiones con rodillas apoyadas', reps('bodyweight', 3, 10, 3, 'medium')),
  named('Flexiones inclinadas en la mesa', reps('bodyweight', 3, 10, 3, 'light')),
  named('Sentadilla sin peso', reps('bodyweight', 3, 15, 3, 'light')),
  named('Zancada hacia atrás', reps('bodyweight', 3, 10, 3, 'medium', true)),
  named('Superman', reps('bodyweight', 3, 10, 3, 'light')),
  named('Abdominales (crunch)', reps('bodyweight', 3, 15, 2, 'light')),
  named('Escalador lento', reps('circuit', 1, 20, 2, 'medium')),
  named('Tijeras con paso (sin salto)', reps('circuit', 1, 20, 2, 'medium')),
  named('Plancha', hold(3, 30)),
  named('Sentadilla en la pared', hold(3, 30)),
  named('Escaleras', { kind: 'stairs', laps: 8, lapSeconds: 70 }),
  named('Movilidad', { kind: 'mobility', minutes: 5 }),
  named('Estiramientos', { kind: 'mobility', minutes: 10 }),
];
