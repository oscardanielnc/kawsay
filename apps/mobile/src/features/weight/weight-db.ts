import { and, asc, between, eq, isNull } from 'drizzle-orm';
import type { LocalDate } from '@kawsay/core/shared/local-date';
import { newRecord } from '@/lib/db/record';
import { weightEntry } from '@/lib/db/schema';
import type { Db, RecordEnv } from '@/lib/db/types';

/** One weight per day (F03): saving again the same day updates that day's record instead of adding one. */
export async function saveWeight(
  db: Db,
  env: RecordEnv,
  input: { date: LocalDate; kg: number; timeZone: string },
): Promise<{ id: string; updatedAt: number }> {
  const existing = await db
    .select({ id: weightEntry.id })
    .from(weightEntry)
    .where(and(eq(weightEntry.date, input.date), isNull(weightEntry.deletedAt)));
  const found = existing[0];
  if (found) {
    const updatedAt = env.now();
    await db
      .update(weightEntry)
      .set({ kg: input.kg, timeZone: input.timeZone, loggedAt: updatedAt, updatedAt })
      .where(eq(weightEntry.id, found.id));
    return { id: found.id, updatedAt };
  }
  const record = newRecord(env);
  await db.insert(weightEntry).values({ ...record, ...input, loggedAt: record.updatedAt });
  return record;
}

/** Live weights in a range of days, oldest first. */
export async function weightsBetween(
  db: Db,
  from: LocalDate,
  to: LocalDate,
): Promise<{ date: LocalDate; kg: number }[]> {
  return db
    .select({ date: weightEntry.date, kg: weightEntry.kg })
    .from(weightEntry)
    .where(and(between(weightEntry.date, from, to), isNull(weightEntry.deletedAt)))
    .orderBy(asc(weightEntry.date));
}

/** Soft delete: the tombstone syncs, and the day is free for a new weight. */
export async function deleteWeight(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await db
    .update(weightEntry)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(weightEntry.id, id));
}
