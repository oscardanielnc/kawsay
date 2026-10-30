import type { LocalDate } from '@kawsay/core/shared/local-date';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { writeDayStatus } from '@/lib/db/day-status';
import { newRecord } from '@/lib/db/record';
import { drinkEntry } from '@/lib/db/schema';
import type { Db, RecordEnv } from '@/lib/db/types';

export type DrinkKind = (typeof drinkEntry.$inferSelect)['kind'];
export type Drink = Pick<
  typeof drinkEntry.$inferSelect,
  'id' | 'kind' | 'volumeMl' | 'alcoholKind' | 'abv'
>;
export type AlcoholKind = NonNullable<Drink['alcoholKind']>;

/** Water, zero-calorie drinks and alcohol tapped in hydration (F10). Caloric drinks live in meals (F05). */
export async function addDrink(
  db: Db,
  env: RecordEnv,
  input: {
    date: LocalDate;
    timeZone: string;
    kind: DrinkKind;
    volumeMl: number;
    /** Alcoholic drinks: which one and its % by volume (F10, ADR 0020). */
    alcoholKind?: AlcoholKind;
    abv?: number;
  },
): Promise<{ id: string }> {
  const record = newRecord(env);
  await db.insert(drinkEntry).values({ ...record, ...input, loggedAt: record.updatedAt });
  return { id: record.id };
}

export async function drinksOn(db: Db, date: LocalDate): Promise<Drink[]> {
  return db
    .select({
      id: drinkEntry.id,
      kind: drinkEntry.kind,
      volumeMl: drinkEntry.volumeMl,
      alcoholKind: drinkEntry.alcoholKind,
      abv: drinkEntry.abv,
    })
    .from(drinkEntry)
    .where(and(eq(drinkEntry.date, date), isNull(drinkEntry.deletedAt)))
    .orderBy(asc(drinkEntry.loggedAt));
}

export async function deleteDrink(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await db.update(drinkEntry).set({ deletedAt: now, updatedAt: now }).where(eq(drinkEntry.id, id));
}

/** "I sweated a lot today": +2 glasses on the day's goal (F10). */
export async function setSweatedALot(
  db: Db,
  env: RecordEnv,
  date: LocalDate,
  on: boolean,
): Promise<void> {
  await writeDayStatus(db, env, date, { sweatedALot: on });
}
