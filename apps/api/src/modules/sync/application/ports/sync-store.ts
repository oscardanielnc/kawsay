import type { Change } from '@kawsay/contracts/sync';

export interface StoredChange extends Change {
  /** Server order; a pull returns changes above the client's cursor. */
  seq: number;
}

/** Where synced records live (ADR 0018). Calls run inside the caller's transaction. */
export abstract class SyncStore {
  /** Serializes this user's pushes until the transaction ends, so `seq` order is commit order. */
  abstract lockUser(userId: string): Promise<void>;
  /** Stores each record only when it is newer than the stored copy; returns how many were stored. */
  abstract upsertNewer(userId: string, changes: Change[]): Promise<number>;
  /** Changes after `since` in server order, at most `limit`. */
  abstract changesSince(userId: string, since: number, limit: number): Promise<StoredChange[]>;
}
