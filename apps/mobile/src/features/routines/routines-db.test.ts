/** @jest-environment node */
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { deleteRoutine, listRoutines, saveRoutine, type RoutineInput } from './routines-db';

function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

const strengthA: RoutineInput = {
  name: 'Fuerza A + escaleras',
  restSeconds: 75,
  exercises: [
    {
      name: 'Sentadilla goblet',
      exercise: { kind: 'weights', sets: 3, reps: 15, secondsPerRep: 4, intensity: 'light' },
    },
    { name: 'Plancha', exercise: { kind: 'isometric', sets: 3, seconds: 30 } },
    {
      name: 'Zancada',
      exercise: {
        kind: 'bodyweight',
        sets: 3,
        reps: 10,
        secondsPerRep: 3,
        intensity: 'medium',
        perSide: true,
      },
    },
    { name: 'Escaleras 1.º → 3.º', exercise: { kind: 'stairs', laps: 4, lapSeconds: 70 } },
    { name: 'Movilidad', exercise: { kind: 'mobility', minutes: 5 } },
  ],
};

describe('routines (F18)', () => {
  it('stores a routine with its exercises in order, each as the core Exercise it was', async () => {
    const db = await createTestDb();
    await saveRoutine(db, env(), strengthA);
    const [routine] = await listRoutines(db);
    expect(routine).toMatchObject({ name: 'Fuerza A + escaleras', restSeconds: 75 });
    expect(routine?.exercises).toEqual(strengthA.exercises);
  });

  it('editing keeps the routine id and replaces its exercises', async () => {
    const db = await createTestDb();
    const e = env();
    const { id } = await saveRoutine(db, e, strengthA);
    await saveRoutine(db, e, {
      ...strengthA,
      id,
      restSeconds: 60,
      exercises: strengthA.exercises.slice(0, 1),
    });
    const routines = await listRoutines(db);
    expect(routines).toHaveLength(1);
    expect(routines[0]).toMatchObject({ id, restSeconds: 60 });
    expect(routines[0]?.exercises).toHaveLength(1);
  });

  it('a deleted routine leaves the list', async () => {
    const db = await createTestDb();
    const e = env();
    const { id } = await saveRoutine(db, e, strengthA);
    await deleteRoutine(db, e, id);
    expect(await listRoutines(db)).toEqual([]);
  });
});
