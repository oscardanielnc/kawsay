import type { Exercise } from '@kawsay/core/energy/routine';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { routine, routineExercise } from '@/lib/db/schema';
import { inTransaction } from '@/lib/db/transaction';
import type { Db, RecordEnv } from '@/lib/db/types';

export interface NamedExercise {
  name: string;
  exercise: Exercise;
}

export interface Routine {
  id: string;
  name: string;
  restSeconds: number;
  exercises: NamedExercise[];
}

export type RoutineInput = Omit<Routine, 'id'> & { id?: string };
type ExerciseRow = typeof routineExercise.$inferSelect;

const NO_FIELDS = {
  sets: null,
  reps: null,
  secondsPerRep: null,
  seconds: null,
  laps: null,
  lapSeconds: null,
  minutes: null,
  intensity: null,
  perSide: false,
};

function toColumns(exercise: Exercise) {
  switch (exercise.kind) {
    case 'weights':
    case 'bodyweight':
      return {
        ...NO_FIELDS,
        sets: exercise.sets,
        reps: exercise.reps,
        secondsPerRep: exercise.secondsPerRep,
        intensity: exercise.intensity,
        perSide: exercise.perSide ?? false,
      };
    case 'isometric':
      return {
        ...NO_FIELDS,
        sets: exercise.sets,
        seconds: exercise.seconds,
        intensity: exercise.intensity ?? null,
        perSide: exercise.perSide ?? false,
      };
    case 'stairs':
      return {
        ...NO_FIELDS,
        laps: exercise.laps,
        lapSeconds: exercise.lapSeconds,
        intensity: exercise.intensity ?? null,
      };
    case 'mobility':
      return { ...NO_FIELDS, minutes: exercise.minutes, intensity: exercise.intensity ?? null };
  }
}

/** Rebuilds core's Exercise from its row, with only the fields its kind has. */
function toExercise(row: ExerciseRow): Exercise {
  const intensity = row.intensity ? { intensity: row.intensity } : {};
  const perSide = row.perSide ? { perSide: true } : {};
  switch (row.kind) {
    case 'weights':
    case 'bodyweight':
      return {
        kind: row.kind,
        sets: row.sets ?? 1,
        reps: row.reps ?? 1,
        secondsPerRep: row.secondsPerRep ?? 1,
        intensity: row.intensity ?? 'medium',
        ...perSide,
      };
    case 'isometric':
      return {
        kind: 'isometric',
        sets: row.sets ?? 1,
        seconds: row.seconds ?? 1,
        ...intensity,
        ...perSide,
      };
    case 'stairs':
      return { kind: 'stairs', laps: row.laps ?? 1, lapSeconds: row.lapSeconds ?? 1, ...intensity };
    case 'mobility':
      return { kind: 'mobility', minutes: row.minutes ?? 1, ...intensity };
  }
}

export async function listRoutines(db: Db): Promise<Routine[]> {
  const [routines, exercises] = await Promise.all([
    db.select().from(routine).where(isNull(routine.deletedAt)).orderBy(asc(routine.name)),
    db
      .select()
      .from(routineExercise)
      .where(isNull(routineExercise.deletedAt))
      .orderBy(asc(routineExercise.position)),
  ]);
  return routines.map((r) => ({
    id: r.id,
    name: r.name,
    restSeconds: r.restSeconds,
    exercises: exercises
      .filter((e) => e.routineId === r.id)
      .map((e) => ({ name: e.name, exercise: toExercise(e) })),
  }));
}

/** Creates or edits a routine; its old exercises are tombstoned and the new list written in order. */
export async function saveRoutine(
  db: Db,
  env: RecordEnv,
  input: RoutineInput,
): Promise<{ id: string }> {
  return inTransaction(db, async () => {
    let id = input.id;
    const now = env.now();
    if (id) {
      await db
        .update(routine)
        .set({ name: input.name, restSeconds: input.restSeconds, updatedAt: now })
        .where(eq(routine.id, id));
      await db
        .update(routineExercise)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(eq(routineExercise.routineId, id), isNull(routineExercise.deletedAt)));
    } else {
      const record = newRecord(env);
      id = record.id;
      await db
        .insert(routine)
        .values({ ...record, name: input.name, restSeconds: input.restSeconds });
    }
    for (const [position, { name, exercise }] of input.exercises.entries()) {
      await db.insert(routineExercise).values({
        ...newRecord(env),
        routineId: id,
        position,
        name,
        kind: exercise.kind,
        ...toColumns(exercise),
      });
    }
    return { id };
  });
}

export async function deleteRoutine(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await inTransaction(db, async () => {
    await db.update(routine).set({ deletedAt: now, updatedAt: now }).where(eq(routine.id, id));
    await db
      .update(routineExercise)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(routineExercise.routineId, id));
  });
}
