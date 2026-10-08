import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from './schema';

/** Either the Expo driver on the phone (sync) or the Node driver in tests (async); queries are awaited in both. */
export type Db = BaseSQLiteDatabase<'sync' | 'async', unknown, typeof schema>;

/** What a new record needs from the world: the clock and secure randomness (injected for tests). */
export interface RecordEnv {
  now(): number;
  randomBytes(count: number): Uint8Array;
}
