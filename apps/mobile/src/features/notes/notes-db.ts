import type { LocalDate } from '@kawsay/core/shared/local-date';
import { and, asc, between, eq, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { dayNote } from '@/lib/db/schema';
import type { Db, RecordEnv } from '@/lib/db/types';

export interface DayNote {
  id: string;
  text: string;
  /** When it was first written (ms UTC) and in which zone; editing keeps both. */
  loggedAt: number;
  timeZone: string;
}

/** Longest note accepted, the same limit as the sync contract. */
export const NOTE_MAX_LENGTH = 4000;

export async function notesOn(db: Db, date: LocalDate): Promise<DayNote[]> {
  return db
    .select({
      id: dayNote.id,
      text: dayNote.text,
      loggedAt: dayNote.loggedAt,
      timeZone: dayNote.timeZone,
    })
    .from(dayNote)
    .where(and(eq(dayNote.date, date), isNull(dayNote.deletedAt)))
    .orderBy(asc(dayNote.loggedAt));
}

/** Notes from `from` to `to` (inclusive), by day then by time written: what the AI analysis reads (ADR 0019). */
export async function notesBetween(
  db: Db,
  from: LocalDate,
  to: LocalDate,
): Promise<{ date: LocalDate; text: string }[]> {
  return db
    .select({ date: dayNote.date, text: dayNote.text })
    .from(dayNote)
    .where(and(between(dayNote.date, from, to), isNull(dayNote.deletedAt)))
    .orderBy(asc(dayNote.date), asc(dayNote.loggedAt));
}

/** Creates a note, or replaces the text of `id` (F21). Blank text throws: there is nothing to save. */
export async function saveNote(
  db: Db,
  env: RecordEnv,
  input: { id?: string; date: LocalDate; timeZone: string; text: string },
): Promise<void> {
  const text = input.text.trim();
  if (text === '') throw new RangeError('a note needs text');
  if (text.length > NOTE_MAX_LENGTH) throw new RangeError('note too long');
  if (input.id) {
    await db.update(dayNote).set({ text, updatedAt: env.now() }).where(eq(dayNote.id, input.id));
    return;
  }
  const record = newRecord(env);
  await db.insert(dayNote).values({
    ...record,
    date: input.date,
    timeZone: input.timeZone,
    loggedAt: record.updatedAt,
    text,
  });
}

export async function deleteNote(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await db.update(dayNote).set({ deletedAt: now, updatedAt: now }).where(eq(dayNote.id, id));
}
