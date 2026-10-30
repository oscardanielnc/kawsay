import { sql } from 'drizzle-orm';
import type { Db } from './types';

/** Open transactions per database: an inner `inTransaction` joins the outer one instead of nesting BEGIN. */
const depth = new WeakMap<Db, number>();

/**
 * Runs awaited statements as one transaction on both drivers. Drizzle's `transaction()` on the synchronous Expo
 * driver commits as soon as the callback returns, before its awaits finish, so BEGIN/COMMIT are explicit here.
 * Called inside another one, it becomes part of it: a failure rolls back the whole outer transaction.
 */
export async function inTransaction<T>(db: Db, work: () => Promise<T>): Promise<T> {
  const open = depth.get(db) ?? 0;
  if (open > 0) {
    depth.set(db, open + 1);
    try {
      return await work();
    } finally {
      depth.set(db, open);
    }
  }
  await db.run(sql`BEGIN`);
  depth.set(db, 1);
  try {
    const result = await work();
    await db.run(sql`COMMIT`);
    return result;
  } catch (error) {
    await db.run(sql`ROLLBACK`);
    throw error;
  } finally {
    depth.set(db, 0);
  }
}
