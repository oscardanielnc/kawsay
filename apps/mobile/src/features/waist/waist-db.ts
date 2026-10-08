import { weekStart, type LocalDate } from '@kawsay/core/shared/local-date';
import { and, asc, desc, eq, gte, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { waistEntry } from '@/lib/db/schema';
import type { Db, RecordEnv } from '@/lib/db/types';

export interface Waist {
  weekStart: LocalDate;
  cm: number;
}

/** One waist per week (F04): a second measurement the same week replaces the first. */
export async function saveWaist(
  db: Db,
  env: RecordEnv,
  input: { date: LocalDate; cm: number; timeZone: string },
): Promise<void> {
  const week = weekStart(input.date);
  const [existing] = await db
    .select({ id: waistEntry.id })
    .from(waistEntry)
    .where(and(eq(waistEntry.weekStart, week), isNull(waistEntry.deletedAt)));
  if (existing) {
    const now = env.now();
    await db
      .update(waistEntry)
      .set({ ...input, loggedAt: now, updatedAt: now })
      .where(eq(waistEntry.id, existing.id));
    return;
  }
  const record = newRecord(env);
  await db
    .insert(waistEntry)
    .values({ ...record, ...input, weekStart: week, loggedAt: record.updatedAt });
}

/** Weeks from `from` on, oldest first. */
export async function waistsSince(db: Db, from: LocalDate): Promise<Waist[]> {
  return db
    .select({ weekStart: waistEntry.weekStart, cm: waistEntry.cm })
    .from(waistEntry)
    .where(and(gte(waistEntry.weekStart, weekStart(from)), isNull(waistEntry.deletedAt)))
    .orderBy(asc(waistEntry.weekStart));
}

export async function latestWaist(db: Db): Promise<Waist | null> {
  const [row] = await db
    .select({ weekStart: waistEntry.weekStart, cm: waistEntry.cm })
    .from(waistEntry)
    .where(isNull(waistEntry.deletedAt))
    .orderBy(desc(waistEntry.weekStart))
    .limit(1);
  return row ?? null;
}
