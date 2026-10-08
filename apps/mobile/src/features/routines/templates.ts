import type { NamedExercise } from './routines-db';

/** Starting points for "+ Exercise" (routine prototype); every value stays editable. */
export const EXERCISE_TEMPLATES: readonly NamedExercise[] = [
  {
    name: 'Sentadilla goblet',
    exercise: { kind: 'weights', sets: 3, reps: 15, secondsPerRep: 4, intensity: 'light' },
  },
  {
    name: 'Zancada estática',
    exercise: {
      kind: 'weights',
      sets: 3,
      reps: 10,
      secondsPerRep: 3,
      intensity: 'light',
      perSide: true,
    },
  },
  {
    name: 'Peso muerto rumano',
    exercise: { kind: 'weights', sets: 3, reps: 15, secondsPerRep: 4, intensity: 'light' },
  },
  {
    name: 'Bicho muerto',
    exercise: {
      kind: 'bodyweight',
      sets: 3,
      reps: 10,
      secondsPerRep: 3,
      intensity: 'light',
      perSide: true,
    },
  },
  { name: 'Plancha', exercise: { kind: 'isometric', sets: 3, seconds: 30 } },
  { name: 'Escaleras', exercise: { kind: 'stairs', laps: 8, lapSeconds: 70 } },
  { name: 'Movilidad', exercise: { kind: 'mobility', minutes: 5 } },
];
