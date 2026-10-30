import { Summary } from '@kawsay/contracts/insights';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { meta } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';

/** A long analysis stored by an older app stays under its old key and reads as no summary yet (ADR 0022). */
const KEY = 'insights.lastSummary';
const Stored = z.object({
  summary: Summary,
  /** When it was made, ms UTC. */
  at: z.number(),
  remaining: z.number().int().nonnegative(),
});
export type StoredAnalysis = z.infer<typeof Stored>;

/** The latest AI summary stays on this phone only (local `meta`, not synced), so it survives closing the app. */
export async function saveAnalysis(db: Db, value: StoredAnalysis): Promise<void> {
  const text = JSON.stringify(value);
  await db
    .insert(meta)
    .values({ key: KEY, value: text })
    .onConflictDoUpdate({ target: meta.key, set: { value: text } });
}

/** null before the first analysis, or if what was stored no longer matches the contract. */
export async function lastAnalysis(db: Db): Promise<StoredAnalysis | null> {
  const [row] = await db.select().from(meta).where(eq(meta.key, KEY));
  if (!row) return null;
  try {
    const parsed = Stored.safeParse(JSON.parse(row.value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
