import type { ClockTime } from '@kawsay/core/shared/clock-time';
import type { LocalDate } from '@kawsay/core/shared/local-date';
import {
  sessionHours,
  sessionStamps,
  type SleepKind,
  type SleepStamps,
} from '@kawsay/core/sleep/sleep-session';
import { and, asc, desc, eq, isNull, ne } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { sleepSession } from '@/lib/db/schema';
import type { Db, RecordEnv } from '@/lib/db/types';

export type { SleepKind };

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

/**
 * Saves a session, upserting by id: a nap draft brings the id it got when shown, so quick taps update one nap.
 * A day has one night (F11): saving a night without an id edits that day's night, so two quick taps on the draft
 * never create two; saving a night also removes any extra night the day still holds.
 */
export async function saveSleep(
  db: Db,
  env: RecordEnv,
  input: SleepInput,
): Promise<{ id: string }> {
  const { id: givenId, start, end, ...rest } = input;
  const stamps = sessionStamps(input.date, { kind: input.kind, start, end });
  const id =
    givenId ?? (input.kind === 'night' ? (await nightsOn(db, input.date))[0]?.id : undefined);
  const now = env.now();
  const saved = id ?? newRecord(env).id;
  await db
    .insert(sleepSession)
    .values({ id: saved, updatedAt: now, ...rest, ...stamps })
    .onConflictDoUpdate({
      target: sleepSession.id,
      set: { ...rest, ...stamps, updatedAt: now },
    });
  if (input.kind === 'night') {
    await db
      .update(sleepSession)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          eq(sleepSession.date, input.date),
          eq(sleepSession.kind, 'night'),
          isNull(sleepSession.deletedAt),
          ne(sleepSession.id, saved),
        ),
      );
  }
  return { id: saved };
}

/** The day's live nights, latest edit first (normally one). */
function nightsOn(db: Db, date: LocalDate) {
  return db
    .select({ id: sleepSession.id })
    .from(sleepSession)
    .where(
      and(
        eq(sleepSession.date, date),
        eq(sleepSession.kind, 'night'),
        isNull(sleepSession.deletedAt),
      ),
    )
    .orderBy(desc(sleepSession.updatedAt));
}

/** The day's sessions, night first, then naps by start. */
export async function sleepOn(db: Db, date: LocalDate): Promise<SleepSession[]> {
  const rows = await db
    .select()
    .from(sleepSession)
    .where(and(eq(sleepSession.date, date), isNull(sleepSession.deletedAt)))
    .orderBy(asc(sleepSession.start));
  // A day shows one night: the latest edit, if an older copy is still there (it goes on the next save).
  const night = rows
    .filter((row) => row.kind === 'night')
    .reduce<(typeof rows)[number] | null>(
      (latest, row) => (!latest || row.updatedAt > latest.updatedAt ? row : latest),
      null,
    );
  return rows
    .filter((row) => row.kind === 'nap' || row === night)
    .map((row) => {
      const start = row.start.slice(11);
      const end = row.end.slice(11);
      // Derived again from the clock, so a session saved under an older midnight rule reads with the current one.
      const stamps = sessionStamps(date, { kind: row.kind, start, end });
      return {
        id: row.id,
        kind: row.kind,
        start,
        end,
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
