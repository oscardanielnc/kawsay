import type { LocalDate } from '@kawsay/core/shared/local-date';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { pendingMeal } from '@/lib/db/schema';
import { inTransaction } from '@/lib/db/transaction';
import type { Db, RecordEnv } from '@/lib/db/types';
import { addMeal, type Meal } from './meals-db';

/** A meal saved by name while its food is missing (F23 piece 1). */
export interface PendingMeal {
  id: string;
  meal: Meal;
  name: string;
  portion: string;
}

export async function addPending(
  db: Db,
  env: RecordEnv,
  input: { date: LocalDate; timeZone: string; meal: Meal; name: string; portion: string },
): Promise<{ id: string }> {
  const name = input.name.trim();
  if (!name) throw new Error('a pending meal needs a name');
  const record = newRecord(env);
  await db.insert(pendingMeal).values({
    ...record,
    ...input,
    name,
    portion: input.portion.trim(),
    loggedAt: record.updatedAt,
  });
  return { id: record.id };
}

export async function pendingOn(db: Db, date: LocalDate): Promise<PendingMeal[]> {
  return db
    .select({
      id: pendingMeal.id,
      meal: pendingMeal.meal,
      name: pendingMeal.name,
      portion: pendingMeal.portion,
    })
    .from(pendingMeal)
    .where(and(eq(pendingMeal.date, date), isNull(pendingMeal.deletedAt)))
    .orderBy(asc(pendingMeal.loggedAt));
}

export async function deletePending(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await db
    .update(pendingMeal)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(pendingMeal.id, id));
}

/** Logs the real entry for a pending meal and removes the pending one, both or neither (F23). */
export async function completePending(
  db: Db,
  env: RecordEnv,
  pendingId: string,
  entry: Parameters<typeof addMeal>[2],
): Promise<{ id: string }> {
  return inTransaction(db, async () => {
    const added = await addMeal(db, env, entry);
    await deletePending(db, env, pendingId);
    return added;
  });
}
