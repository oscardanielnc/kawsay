import type { ClockTime } from '@kawsay/core/shared/clock-time';
import type { LocalDate } from '@kawsay/core/shared/local-date';
import { sessionHours, sessionStamps, type SleepStamps } from '@kawsay/core/sleep/sleep-session';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { sleepSession } from '@/lib/db/schema';
import type { Db, RecordEnv } from '@/lib/db/types';

export type SleepKind = 'night' | 'nap';

export interface SleepInput {
  /** Edits that session when given. */
  id?: string;
  /** The day the session counts for: the day you woke up. */
  date: LocalDate;
  kind: SleepKind;
  start: ClockTime;
  end: ClockTime;
  timeZone: string;
  /** 1 very poor … 5 excellent. */
  quality: number | null;
  nightmares: boolean;
}

export interface SleepSession {
  id: string;
  kind: SleepKind;
  start: ClockTime;
  end: ClockTime;
  stamps: SleepStamps;
  hours: number;
  quality: number | null;
  nightmares: boolean;
}

export async function saveSleep(
  db: Db,
  env: RecordEnv,
  input: SleepInput,
): Promise<{ id: string }> {
  const { id, start, end, ...rest } = input;
  const stamps = sessionStamps(input.date, { start, end });
  if (id) {
    await db
      .update(sleepSession)
      .set({ ...rest, ...stamps, updatedAt: env.now() })
      .where(eq(sleepSession.id, id));
    return { id };
  }
  const record = newRecord(env);
  await db.insert(sleepSession).values({ ...record, ...rest, ...stamps });
  return { id: record.id };
}

/** The day's sessions, night first, then naps by start. */
export async function sleepOn(db: Db, date: LocalDate): Promise<SleepSession[]> {
  const rows = await db
    .select()
    .from(sleepSession)
    .where(and(eq(sleepSession.date, date), isNull(sleepSession.deletedAt)))
    .orderBy(asc(sleepSession.start));
  return rows
    .map((row) => {
      const stamps = { start: row.start, end: row.end };
      return {
        id: row.id,
        kind: row.kind,
        start: row.start.slice(11),
        end: row.end.slice(11),
        stamps,
        hours: sessionHours(stamps),
        quality: row.quality,
        nightmares: row.nightmares,
      };
    })
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'night' ? -1 : 1));
}

export async function deleteSleep(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await db
    .update(sleepSession)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(sleepSession.id, id));
}
