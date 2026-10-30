import type { LocalDate } from '@kawsay/core/shared/local-date';
import { desc } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { labResult } from '@/lib/db/schema';
import type { Db, RecordEnv } from '@/lib/db/types';

/** A liver lab result (F25): it never leaves the phone except in the user's own export (F15). */
export interface LabResult {
  id: string;
  date: LocalDate;
  ast: number;
  alt: number;
  platelets: number;
}

export async function addLab(
  db: Db,
  env: RecordEnv,
  input: Omit<LabResult, 'id'>,
): Promise<{ id: string }> {
  const { id, updatedAt } = newRecord(env);
  await db.insert(labResult).values({ id, ...input, createdAt: updatedAt });
  return { id };
}

/** Every lab result, newest first. */
export async function listLabs(db: Db): Promise<LabResult[]> {
  return db
    .select({
      id: labResult.id,
      date: labResult.date,
      ast: labResult.ast,
      alt: labResult.alt,
      platelets: labResult.platelets,
    })
    .from(labResult)
    .orderBy(desc(labResult.date), desc(labResult.createdAt));
}
