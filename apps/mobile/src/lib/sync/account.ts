import { eq, inArray } from 'drizzle-orm';
import { meta } from '../db/schema';
import type { Db } from '../db/types';
import { startOver } from './engine';

/** How this phone is used: signed in to an account, on its own by choice, or not decided yet (first open). */
export type AccountState =
  | { kind: 'signed-in'; userId: string; email: string; lastSyncedAt: number | null }
  | { kind: 'local-only' }
  | { kind: 'undecided' };

const KEYS = {
  userId: 'account.userId',
  email: 'account.email',
  localOnly: 'account.localOnly',
  lastSyncedAt: 'sync.lastSyncedAt',
} as const;

async function put(db: Db, key: string, value: string): Promise<void> {
  await db
    .insert(meta)
    .values({ key, value })
    .onConflictDoUpdate({ target: meta.key, set: { value } });
}

export async function readAccount(db: Db): Promise<AccountState> {
  const rows = await db
    .select()
    .from(meta)
    .where(inArray(meta.key, Object.values(KEYS)));
  const value = (key: string) => rows.find((row) => row.key === key)?.value;
  const userId = value(KEYS.userId);
  const email = value(KEYS.email);
  if (userId && email) {
    const last = value(KEYS.lastSyncedAt);
    return { kind: 'signed-in', userId, email, lastSyncedAt: last ? Number(last) : null };
  }
  return value(KEYS.localOnly) ? { kind: 'local-only' } : { kind: 'undecided' };
}

/**
 * Remembers the account. A different account than the last one on this phone (or the first one) starts over:
 * its whole history is pulled and every local record is pushed to it.
 */
export async function rememberAccount(db: Db, account: { userId: string; email: string }) {
  const [previous] = await db.select().from(meta).where(eq(meta.key, 'sync.accountOfCursor'));
  if (previous?.value !== account.userId) {
    await startOver(db);
    await put(db, 'sync.accountOfCursor', account.userId);
  }
  await put(db, KEYS.userId, account.userId);
  await put(db, KEYS.email, account.email);
  await db.delete(meta).where(eq(meta.key, KEYS.localOnly));
}

/** Signed out: local data stays; the phone keeps working on its own. */
export async function forgetAccount(db: Db): Promise<void> {
  await db.delete(meta).where(inArray(meta.key, [KEYS.userId, KEYS.email, KEYS.lastSyncedAt]));
  await put(db, KEYS.localOnly, '1');
}

export async function chooseLocalOnly(db: Db): Promise<void> {
  await put(db, KEYS.localOnly, '1');
}

export async function markSynced(db: Db, at: number): Promise<void> {
  await put(db, KEYS.lastSyncedAt, String(at));
}
