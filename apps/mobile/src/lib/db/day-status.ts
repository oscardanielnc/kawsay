import type { LocalDate } from '@kawsay/core/shared/local-date';
import { and, eq, isNull } from 'drizzle-orm';
import { newRecord } from './record';
import { dayStatus } from './schema';
import type { Db, RecordEnv } from './types';

export interface DayFlags {
  /** "No physical activity" (F08). */
  noActivity: boolean;
  /** "I sweated a lot today": +2 glasses (F10). */
  sweatedALot: boolean;
}

/** The day's flags; a day never touched reads as all off. Shared by activity and hydration. */
export async function dayStatusOn(db: Db, date: LocalDate): Promise<DayFlags> {
  const [row] = await db
    .select({ noActivity: dayStatus.noActivity, sweatedALot: dayStatus.sweatedALot })
    .from(dayStatus)
    .where(and(eq(dayStatus.date, date), isNull(dayStatus.deletedAt)));
  return row ?? { noActivity: false, sweatedALot: false };
}

/** Changes some flags of the day, creating its row on first use (one live row per day). */
export async function writeDayStatus(
  db: Db,
  env: RecordEnv,
  date: LocalDate,
  patch: Partial<DayFlags>,
): Promise<void> {
  const [existing] = await db
    .select({ id: dayStatus.id })
    .from(dayStatus)
    .where(and(eq(dayStatus.date, date), isNull(dayStatus.deletedAt)));
  if (existing) {
    await db
      .update(dayStatus)
      .set({ ...patch, updatedAt: env.now() })
      .where(eq(dayStatus.id, existing.id));
  } else {
    await db
      .insert(dayStatus)
      .values({ ...newRecord(env), date, noActivity: false, sweatedALot: false, ...patch });
  }
}
