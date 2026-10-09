import type { Collection } from '@kawsay/contracts/records';
import {
  type Change,
  type PullResponse,
  type PushResponse,
  SYNC_PAGE_SIZE,
} from '@kawsay/contracts/sync';
import { and, eq, getTableColumns, inArray, isNull, lte, ne, sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { meta, syncOutbox } from '../db/schema';
import { inTransaction } from '../db/transaction';
import type { Db, RecordEnv } from '../db/types';
import { NATURAL_KEYS, SYNCED_TABLES } from './collections';

/** What the engine needs from the server (ADR 0004); the HTTP client and the tests' fake both provide it. */
export interface SyncApi {
  push(changes: Change[]): Promise<PushResponse>;
  pull(since: number): Promise<PullResponse>;
}

type Row = Record<string, unknown> & { id: string; updatedAt: number; deletedAt: number | null };

const CURSOR = 'sync.cursor';
const APPLYING = 'sync.applying';

/** Local records changed and not yet on the server. */
export async function pendingCount(db: Db): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(distinct ${syncOutbox.collection} || ${syncOutbox.recordId})` })
    .from(syncOutbox);
  return rows[0]?.n ?? 0;
}

/** Push, pull, then push what the pull settled (a natural-key tie turns one record into a tombstone). */
export async function syncOnce(
  db: Db,
  env: RecordEnv,
  api: SyncApi,
): Promise<{ pushed: number; pulled: number }> {
  let pushed = await pushPending(db, api);
  const pulled = await pullChanges(db, env, api);
  pushed += await pushPending(db, api);
  return { pushed, pulled };
}

/** Sends the outbox page by page; an entry leaves the outbox only after the server answered. */
async function pushPending(db: Db, api: SyncApi): Promise<number> {
  let pushed = 0;
  for (;;) {
    const queued = await db.select().from(syncOutbox).orderBy(syncOutbox.seq).limit(SYNC_PAGE_SIZE);
    const last = queued.at(-1);
    if (!last) return pushed;

    const changes: Change[] = [];
    const idsBy = new Map<Collection, Set<string>>();
    for (const { collection, recordId } of queued) {
      if (!(collection in SYNCED_TABLES)) continue;
      const ids = idsBy.get(collection as Collection) ?? new Set<string>();
      idsBy.set(collection as Collection, ids.add(recordId));
    }
    for (const [collection, ids] of idsBy) {
      const table = SYNCED_TABLES[collection];
      const rows = await db
        .select()
        .from(table)
        .where(inArray(table.id, [...ids]));
      for (const record of rows) changes.push({ collection, record });
    }

    if (changes.length > 0) await api.push(changes);
    pushed += changes.length;
    await db.delete(syncOutbox).where(lte(syncOutbox.seq, last.seq));
  }
}

/** Pulls every page after the stored cursor; each page is applied and its cursor saved in one transaction. */
async function pullChanges(db: Db, env: RecordEnv, api: SyncApi): Promise<number> {
  let pulled = 0;
  for (;;) {
    const page = await api.pull(await cursorOf(db));
    await inTransaction(db, async () => {
      await db.insert(meta).values({ key: APPLYING, value: '1' }).onConflictDoNothing();
      for (const change of page.changes) await applyChange(db, env, change);
      await db.delete(meta).where(eq(meta.key, APPLYING));
      await db
        .insert(meta)
        .values({ key: CURSOR, value: String(page.cursor) })
        .onConflictDoUpdate({ target: meta.key, set: { value: String(page.cursor) } });
    });
    pulled += page.changes.length;
    if (!page.more) return pulled;
  }
}

/** Order of two versions: newest edit first; equal times fall back to the id, so every phone picks the same one. */
const isNewer = (a: Row, b: Row) =>
  a.updatedAt > b.updatedAt || (a.updatedAt === b.updatedAt && a.id > b.id);

/** Stores a pulled record unless the phone has a newer copy (last write wins, ADR 0004). */
async function applyChange(db: Db, env: RecordEnv, change: Change): Promise<void> {
  const table = SYNCED_TABLES[change.collection];
  const columns = getTableColumns(table) as Record<string, SQLiteColumn>;
  let incoming = change.record as Row;

  const [local] = (await db.select().from(table).where(eq(table.id, incoming.id))) as Row[];
  if (local && !isNewer(incoming, local)) return;

  const key = NATURAL_KEYS[change.collection];
  if (key && incoming.deletedAt === null) {
    const sameKey: SQL[] = key.map((field) => eq(columns[field] as SQLiteColumn, incoming[field]));
    const [rival] = (await db
      .select()
      .from(table)
      .where(and(isNull(table.deletedAt), ne(table.id, incoming.id), ...sameKey))) as Row[];
    if (rival) {
      // One live record per key: the older one becomes a tombstone, and that tombstone is pushed.
      const now = env.now();
      if (isNewer(rival, incoming)) {
        incoming = { ...incoming, deletedAt: now, updatedAt: now };
        await queue(db, change.collection, incoming.id);
      } else {
        await db
          .update(table)
          .set({ deletedAt: now, updatedAt: now })
          .where(eq(table.id, rival.id));
        await queue(db, change.collection, rival.id);
      }
    }
  }

  await db
    .insert(table)
    .values(incoming as never)
    .onConflictDoUpdate({ target: table.id, set: incoming });
}

async function queue(db: Db, collection: Collection, recordId: string): Promise<void> {
  await db.insert(syncOutbox).values({ collection, recordId });
}

async function cursorOf(db: Db): Promise<number> {
  const [row] = await db.select().from(meta).where(eq(meta.key, CURSOR));
  return row ? Number(row.value) : 0;
}

/** Signing in to another account: pull its whole history and push every local record to it. */
export async function startOver(db: Db): Promise<void> {
  await inTransaction(db, async () => {
    await db.delete(meta).where(eq(meta.key, CURSOR));
    await db.delete(syncOutbox);
    for (const [collection, table] of Object.entries(SYNCED_TABLES)) {
      const rows = await db.select({ id: table.id }).from(table);
      for (const { id } of rows) await queue(db, collection as Collection, id);
    }
  });
}
