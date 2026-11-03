import type { LocalDate } from '@kawsay/core/shared/local-date';
import { inTransaction } from '@/lib/db/transaction';
import type { Db, RecordEnv } from '@/lib/db/types';
import { addMeal, type Meal } from './meals-db';
import { addPending } from './pending-db';

/** One confirmed card of a text log, in the units `addMeal` takes. */
export interface TextLogEntry {
  meal: Meal;
  item: { kind: 'dish' | 'food'; id: string };
  servings?: number;
  grams?: number;
}

/**
 * "Guardar todo" (F16): every card and every pending item in one transaction, so a failure saves nothing. Nutrients
 * come from the catalog like any entry (ADR 0008).
 */
export async function saveTextLog(
  db: Db,
  env: RecordEnv,
  input: {
    date: LocalDate;
    timeZone: string;
    entries: readonly TextLogEntry[];
    pending: readonly { meal: Meal; name: string }[];
  },
): Promise<void> {
  await inTransaction(db, async () => {
    for (const entry of input.entries) {
      await addMeal(db, env, { date: input.date, timeZone: input.timeZone, ...entry });
    }
    for (const item of input.pending) {
      await addPending(db, env, {
        date: input.date,
        timeZone: input.timeZone,
        meal: item.meal,
        name: item.name,
        portion: '1',
      });
    }
  });
}
