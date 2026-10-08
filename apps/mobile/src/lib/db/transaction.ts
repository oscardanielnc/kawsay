import { sql } from 'drizzle-orm';
import type { Db } from './types';

/**
 * Runs awaited statements as one transaction on both drivers. Drizzle's `transaction()` on the synchronous Expo
 * driver commits as soon as the callback returns, before its awaits finish, so BEGIN/COMMIT are explicit here.
 */
export async function inTransaction<T>(db: Db, work: () => Promise<T>): Promise<T> {
  await db.run(sql`BEGIN`);
  try {
    const result = await work();
    await db.run(sql`COMMIT`);
    return result;
  } catch (error) {
    await db.run(sql`ROLLBACK`);
    throw error;
  }
}
