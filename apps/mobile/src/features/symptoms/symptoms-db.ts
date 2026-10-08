import type { LocalDate } from '@kawsay/core/shared/local-date';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { symptom, symptomEntry } from '@/lib/db/schema';
import { inTransaction } from '@/lib/db/transaction';
import type { Db, RecordEnv } from '@/lib/db/types';

export type SymptomScale = (typeof symptom.$inferSelect)['scale'];
export interface Symptom {
  id: string;
  name: string;
  scale: SymptomScale;
}

export async function createSymptom(
  db: Db,
  env: RecordEnv,
  input: { name: string; scale: SymptomScale },
): Promise<Symptom> {
  const name = input.name.trim();
  if (!name) throw new Error('a symptom needs a name');
  const record = newRecord(env);
  await db.insert(symptom).values({ ...record, name, scale: input.scale });
  return { id: record.id, name, scale: input.scale };
}

export async function listSymptoms(db: Db): Promise<Symptom[]> {
  return db
    .select({ id: symptom.id, name: symptom.name, scale: symptom.scale })
    .from(symptom)
    .where(isNull(symptom.deletedAt))
    .orderBy(asc(symptom.updatedAt));
}

export async function deleteSymptom(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await db.update(symptom).set({ deletedAt: now, updatedAt: now }).where(eq(symptom.id, id));
}

/** The day's answer per symptom id. */
export async function symptomAnswersOn(db: Db, date: LocalDate): Promise<Record<string, string>> {
  const rows = await db
    .select({ symptomId: symptomEntry.symptomId, value: symptomEntry.value })
    .from(symptomEntry)
    .where(and(eq(symptomEntry.date, date), isNull(symptomEntry.deletedAt)));
  return Object.fromEntries(rows.map((r) => [r.symptomId, r.value]));
}

/** Answers a symptom for the day, replacing an earlier answer; `null` clears it. */
export async function answerSymptom(
  db: Db,
  env: RecordEnv,
  input: { date: LocalDate; timeZone: string; symptomId: string; value: string | null },
): Promise<void> {
  await inTransaction(db, async () => {
    const now = env.now();
    await db
      .update(symptomEntry)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          eq(symptomEntry.date, input.date),
          eq(symptomEntry.symptomId, input.symptomId),
          isNull(symptomEntry.deletedAt),
        ),
      );
    if (input.value === null) return;
    const record = newRecord(env);
    await db.insert(symptomEntry).values({
      ...record,
      date: input.date,
      timeZone: input.timeZone,
      loggedAt: record.updatedAt,
      symptomId: input.symptomId,
      value: input.value,
    });
  });
}
