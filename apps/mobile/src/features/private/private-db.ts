import type { LocalDate } from '@kawsay/core/shared/local-date';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { intimateEntry } from '@/lib/db/schema';
import type { Db, RecordEnv } from '@/lib/db/types';

export type IntimateKind = (typeof intimateEntry.$inferSelect)['kind'];
export interface IntimateEntry {
  id: string;
  kind: IntimateKind;
}

/** Call only after the user unlocked the private log (F12). */
export async function intimateOn(db: Db, date: LocalDate): Promise<IntimateEntry[]> {
  return db
    .select({ id: intimateEntry.id, kind: intimateEntry.kind })
    .from(intimateEntry)
    .where(and(eq(intimateEntry.date, date), isNull(intimateEntry.deletedAt)))
    .orderBy(asc(intimateEntry.loggedAt));
}

export async function addIntimate(
  db: Db,
  env: RecordEnv,
  input: { date: LocalDate; timeZone: string; kind: IntimateKind },
): Promise<void> {
  const record = newRecord(env);
  await db.insert(intimateEntry).values({ ...record, ...input, loggedAt: record.updatedAt });
}

export async function deleteIntimate(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await db
    .update(intimateEntry)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(intimateEntry.id, id));
}
