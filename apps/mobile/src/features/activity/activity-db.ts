import type { LocalDate } from '@kawsay/core/shared/local-date';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { activityEntry, dayStatus } from '@/lib/db/schema';
import { inTransaction } from '@/lib/db/transaction';
import type { Db, RecordEnv } from '@/lib/db/types';

export type TimeBand = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';
export type ActivityEntry = Pick<
  typeof activityEntry.$inferSelect,
  'id' | 'kind' | 'intensity' | 'minutes' | 'met' | 'timeBand' | 'routineId'
>;

export interface NewActivity {
  date: LocalDate;
  timeZone: string;
  /** An activity type (F08) or 'routine' for a logged routine session (F18). */
  kind: string;
  intensity: 'light' | 'medium' | 'hard' | null;
  minutes: number;
  met: number;
  timeBand: TimeBand;
  routineId?: string;
}

/** Logs an activity; it also clears "No physical activity" for that day (F08). */
export async function addActivity(
  db: Db,
  env: RecordEnv,
  input: NewActivity,
): Promise<{ id: string }> {
  return inTransaction(db, async () => {
    const record = newRecord(env);
    await db.insert(activityEntry).values({
      ...record,
      date: input.date,
      loggedAt: record.updatedAt,
      timeZone: input.timeZone,
      kind: input.kind,
      intensity: input.intensity,
      minutes: input.minutes,
      met: input.met,
      timeBand: input.timeBand,
      routineId: input.routineId ?? null,
    });
    await writeStatus(db, env, input.date, { noActivity: false });
    return { id: record.id };
  });
}

export async function activitiesOn(db: Db, date: LocalDate): Promise<ActivityEntry[]> {
  return db
    .select({
      id: activityEntry.id,
      kind: activityEntry.kind,
      intensity: activityEntry.intensity,
      minutes: activityEntry.minutes,
      met: activityEntry.met,
      timeBand: activityEntry.timeBand,
      routineId: activityEntry.routineId,
    })
    .from(activityEntry)
    .where(and(eq(activityEntry.date, date), isNull(activityEntry.deletedAt)))
    .orderBy(asc(activityEntry.loggedAt));
}

export async function deleteActivity(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await db
    .update(activityEntry)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(activityEntry.id, id));
}

export async function dayStatusOn(
  db: Db,
  date: LocalDate,
): Promise<{ noActivity: boolean; sweatedALot: boolean }> {
  const [row] = await db
    .select({ noActivity: dayStatus.noActivity, sweatedALot: dayStatus.sweatedALot })
    .from(dayStatus)
    .where(and(eq(dayStatus.date, date), isNull(dayStatus.deletedAt)));
  return row ?? { noActivity: false, sweatedALot: false };
}

/** "No physical activity": the base day, exclusive with logged activities (F08). */
export async function setNoActivity(
  db: Db,
  env: RecordEnv,
  date: LocalDate,
  on: boolean,
): Promise<void> {
  await writeStatus(db, env, date, { noActivity: on });
}

async function writeStatus(
  db: Db,
  env: RecordEnv,
  date: LocalDate,
  patch: Partial<{ noActivity: boolean; sweatedALot: boolean }>,
): Promise<void> {
  const [existing] = await db
    .select({ id: dayStatus.id })
    .from(dayStatus)
    .where(and(eq(dayStatus.date, date), isNull(dayStatus.deletedAt)));
  if (existing) {
    await db
      .update(dayStatus)
      .set({ ...patch, updatedAt: env.now() })
      .where(eq(dayStatus.id, existing.id));
  } else {
    await db
      .insert(dayStatus)
      .values({ ...newRecord(env), date, noActivity: false, sweatedALot: false, ...patch });
  }
}
