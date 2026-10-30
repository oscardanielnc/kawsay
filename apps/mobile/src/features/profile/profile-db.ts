import { eq, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { profile } from '@/lib/db/schema';
import type { Db, RecordEnv } from '@/lib/db/types';

export type Profile = typeof profile.$inferSelect;

/** Everything the user sets; `expenditureFactor` only changes through recalibration (ADR 0009). */
export type ProfileInput = Omit<
  Profile,
  'id' | 'updatedAt' | 'deletedAt' | 'expenditureFactor' | 'refinedFlourShare' | 'liverEnabled'
> & {
  expenditureFactor?: number;
  /** Absent keeps the current limit (F24). */
  refinedFlourShare?: number | null;
  liverEnabled?: boolean | null;
};

/** The one profile on this phone, or null before onboarding. */
export async function getProfile(db: Db): Promise<Profile | null> {
  const rows = await db.select().from(profile).where(isNull(profile.deletedAt)).limit(1);
  return rows[0] ?? null;
}

/** Creates the profile, or updates it keeping its id and recalibration factor. */
export async function saveProfile(db: Db, env: RecordEnv, input: ProfileInput): Promise<Profile> {
  const current = await getProfile(db);
  if (current) {
    const updatedAt = env.now();
    await db
      .update(profile)
      .set({
        ...input,
        expenditureFactor: input.expenditureFactor ?? current.expenditureFactor,
        updatedAt,
      })
      .where(eq(profile.id, current.id));
  } else {
    await db.insert(profile).values({ ...newRecord(env), expenditureFactor: 1, ...input });
  }
  const saved = await getProfile(db);
  if (!saved) throw new Error('profile was not saved');
  return saved;
}
