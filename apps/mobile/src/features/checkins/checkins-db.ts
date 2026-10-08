import type { LocalDate } from '@kawsay/core/shared/local-date';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { checkIn } from '@/lib/db/schema';
import type { Db, RecordEnv } from '@/lib/db/types';

export type CheckInKind = (typeof checkIn.$inferSelect)['kind'];
export type CheckIn = Pick<typeof checkIn.$inferSelect, 'id' | 'kind' | 'value' | 'loggedAt'>;

/** The day's state: the latest value per kind, and every bathroom visit in order. */
export interface LatestCheckIns {
  bathroom: string[];
  bloating: string | null;
  stress: string | null;
  energy: string | null;
  mood: string | null;
  urine: string | null;
}

/** One tap = one row with its time (F10). */
export async function addCheckIn(
  db: Db,
  env: RecordEnv,
  input: { date: LocalDate; timeZone: string; kind: CheckInKind; value: string },
): Promise<{ id: string }> {
  const record = newRecord(env);
  await db.insert(checkIn).values({ ...record, ...input, loggedAt: record.updatedAt });
  return { id: record.id };
}

export async function checkInsOn(db: Db, date: LocalDate): Promise<CheckIn[]> {
  return db
    .select({
      id: checkIn.id,
      kind: checkIn.kind,
      value: checkIn.value,
      loggedAt: checkIn.loggedAt,
    })
    .from(checkIn)
    .where(and(eq(checkIn.date, date), isNull(checkIn.deletedAt)))
    .orderBy(asc(checkIn.loggedAt));
}

export async function deleteCheckIn(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await db.update(checkIn).set({ deletedAt: now, updatedAt: now }).where(eq(checkIn.id, id));
}

export function latestCheckIns(rows: readonly CheckIn[]): LatestCheckIns {
  const latest: LatestCheckIns = {
    bathroom: [],
    bloating: null,
    stress: null,
    energy: null,
    mood: null,
    urine: null,
  };
  for (const { kind, value } of rows) {
    if (kind === 'bathroom') latest.bathroom.push(value);
    else latest[kind] = value;
  }
  return latest;
}
