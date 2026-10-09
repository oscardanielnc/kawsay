/** @jest-environment node */
import type { Change, PullResponse, PushResponse } from '@kawsay/contracts/sync';
import { addDays } from '@kawsay/core/shared/local-date';
import { and, eq, isNull } from 'drizzle-orm';
import { createTestDb } from '../db/test-db';
import { dayStatus, profile, syncOutbox, weightEntry } from '../db/schema';
import type { Db, RecordEnv } from '../db/types';
import { newRecord } from '../db/record';
import { pendingCount, startOver, syncOnce, type SyncApi } from './engine';

/** The server's rules in memory (ADR 0004, 0018): newest edit wins, pulls page by a sequence. */
class FakeServer {
  private records = new Map<string, Change & { seq: number }>();
  private seq = 0;

  constructor(private readonly pageSize = 500) {}

  readonly api: SyncApi = {
    push: (changes) => {
      let applied = 0;
      for (const change of changes) {
        const key = `${change.collection}:${change.record.id}`;
        const stored = this.records.get(key);
        if (stored && stored.record.updatedAt >= change.record.updatedAt) continue;
        this.records.set(key, { ...structuredClone(change), seq: ++this.seq });
        applied += 1;
      }
      return Promise.resolve<PushResponse>({ applied });
    },
    pull: (since) => {
      const after = [...this.records.values()]
        .filter((r) => r.seq > since)
        .sort((a, b) => a.seq - b.seq);
      const page = after.slice(0, this.pageSize);
      return Promise.resolve<PullResponse>({
        changes: page.map(({ collection, record }) => structuredClone({ collection, record })),
        cursor: page.at(-1)?.seq ?? since,
        more: after.length > page.length,
      });
    },
  };

  count(collection: string): number {
    return [...this.records.values()].filter((r) => r.collection === collection).length;
  }
}

/** A phone: its own database and clock (clocks differ between phones). */
async function phone(start: number, seed: number): Promise<{ db: Db; env: RecordEnv }> {
  let now = start;
  let counter = seed * 1000;
  return {
    db: await createTestDb(),
    env: {
      now: () => (now += 1000),
      randomBytes: (n) => new Uint8Array(n).fill(++counter % 256),
    },
  };
}

const lima = 'America/Lima';
const T0 = Date.UTC(2026, 9, 9, 12);

async function logWeight(db: Db, env: RecordEnv, date: string, kg: number): Promise<string> {
  const record = newRecord(env);
  await db
    .insert(weightEntry)
    .values({ ...record, date, kg, loggedAt: record.updatedAt, timeZone: lima });
  return record.id;
}

const liveWeights = (db: Db) =>
  db
    .select({ id: weightEntry.id, date: weightEntry.date, kg: weightEntry.kg })
    .from(weightEntry)
    .where(isNull(weightEntry.deletedAt))
    .orderBy(weightEntry.date);

describe('sync engine (F02)', () => {
  it('a weight logged offline waits in the outbox and is pushed once', async () => {
    const server = new FakeServer();
    const { db, env } = await phone(T0, 1);
    await logWeight(db, env, '2026-10-09', 80.2);
    expect(await pendingCount(db)).toBe(1);

    expect(await syncOnce(db, env, server.api)).toMatchObject({ pushed: 1 });
    expect(await pendingCount(db)).toBe(0);
    await syncOnce(db, env, server.api);
    expect(server.count('weight_entry')).toBe(1);
  });

  it('entries from the other phone arrive, and are not queued to be pushed back', async () => {
    const server = new FakeServer();
    const a = await phone(T0, 1);
    const b = await phone(T0, 2);
    await logWeight(a.db, a.env, '2026-10-09', 80.2);
    await syncOnce(a.db, a.env, server.api);

    expect(await syncOnce(b.db, b.env, server.api)).toMatchObject({ pulled: 1 });
    expect(await liveWeights(b.db)).toEqual([expect.objectContaining({ kg: 80.2 })]);
    expect(await pendingCount(b.db)).toBe(0);
  });

  it('editing the same entry on two phones keeps the most recent edit', async () => {
    const server = new FakeServer();
    const a = await phone(T0, 1);
    const b = await phone(T0 + 60_000, 2); // B's clock is a minute ahead
    const id = await logWeight(a.db, a.env, '2026-10-09', 80.2);
    await syncOnce(a.db, a.env, server.api);
    await syncOnce(b.db, b.env, server.api);

    await a.db
      .update(weightEntry)
      .set({ kg: 80.0, updatedAt: a.env.now() })
      .where(eq(weightEntry.id, id));
    await b.db
      .update(weightEntry)
      .set({ kg: 79.8, updatedAt: b.env.now() })
      .where(eq(weightEntry.id, id));
    await syncOnce(b.db, b.env, server.api);
    await syncOnce(a.db, a.env, server.api); // A syncs last, but its edit is older
    await syncOnce(b.db, b.env, server.api);

    expect(await liveWeights(a.db)).toEqual([expect.objectContaining({ kg: 79.8 })]);
    expect(await liveWeights(b.db)).toEqual([expect.objectContaining({ kg: 79.8 })]);
  });

  it('a delete on one phone removes the entry on the other', async () => {
    const server = new FakeServer();
    const a = await phone(T0, 1);
    const b = await phone(T0, 2);
    const id = await logWeight(a.db, a.env, '2026-10-09', 80.2);
    await syncOnce(a.db, a.env, server.api);
    await syncOnce(b.db, b.env, server.api);

    const at = a.env.now();
    await a.db
      .update(weightEntry)
      .set({ deletedAt: at, updatedAt: at })
      .where(eq(weightEntry.id, id));
    await syncOnce(a.db, a.env, server.api);
    await syncOnce(b.db, b.env, server.api);
    expect(await liveWeights(b.db)).toEqual([]);
  });

  it('two phones weigh in on the same day: both end with one weight, the latest', async () => {
    const server = new FakeServer();
    const a = await phone(T0, 1);
    const b = await phone(T0 + 5_000, 2);
    await logWeight(a.db, a.env, '2026-10-09', 80.2);
    await logWeight(b.db, b.env, '2026-10-09', 79.9);

    await syncOnce(a.db, a.env, server.api);
    await syncOnce(b.db, b.env, server.api);
    await syncOnce(a.db, a.env, server.api);

    for (const { db } of [a, b]) {
      expect(await liveWeights(db)).toEqual([expect.objectContaining({ kg: 79.9 })]);
    }
  });

  it('profiles made offline on two phones end as one: the latest', async () => {
    const server = new FakeServer();
    const a = await phone(T0, 1);
    const b = await phone(T0 + 5_000, 2);
    await a.db.insert(profile).values({ ...newRecord(a.env), ...PROFILE });
    await syncOnce(a.db, a.env, server.api);
    await b.db.insert(profile).values({ ...newRecord(b.env), ...PROFILE, heightCm: 170 });
    await syncOnce(b.db, b.env, server.api);
    await syncOnce(a.db, a.env, server.api);

    for (const { db } of [a, b]) {
      const live = await db.select().from(profile).where(isNull(profile.deletedAt));
      expect(live).toEqual([expect.objectContaining({ heightCm: 170 })]);
    }
  });

  it('a one-per-day flag set on both phones keeps one live row', async () => {
    const server = new FakeServer();
    const a = await phone(T0, 1);
    const b = await phone(T0, 2);
    for (const { db, env } of [a, b]) {
      await db
        .insert(dayStatus)
        .values({ ...newRecord(env), date: '2026-10-09', noActivity: true, sweatedALot: false });
      await syncOnce(db, env, server.api);
    }
    await syncOnce(a.db, a.env, server.api);
    for (const { db } of [a, b]) {
      const live = await db
        .select()
        .from(dayStatus)
        .where(and(eq(dayStatus.date, '2026-10-09'), isNull(dayStatus.deletedAt)));
      expect(live).toHaveLength(1);
    }
  });

  it('a long history arrives page by page', async () => {
    const server = new FakeServer(50);
    const a = await phone(T0, 1);
    const b = await phone(T0, 2);
    for (let day = 0; day < 120; day += 1) {
      await logWeight(a.db, a.env, addDays('2026-01-01', day), 80);
    }
    await syncOnce(a.db, a.env, server.api);
    expect(await syncOnce(b.db, b.env, server.api)).toMatchObject({ pulled: 120 });
    expect(await liveWeights(b.db)).toHaveLength(120);
  });

  it('starting over with another account queues every local record again', async () => {
    const server = new FakeServer();
    const { db, env } = await phone(T0, 1);
    await logWeight(db, env, '2026-10-09', 80.2);
    await syncOnce(db, env, server.api);
    expect(await pendingCount(db)).toBe(0);

    await startOver(db);
    expect(await pendingCount(db)).toBe(1);
    expect(await db.select().from(syncOutbox)).toHaveLength(1);
  });
});

const PROFILE = {
  sex: 'male',
  heightCm: 172,
  ageYears: 35,
  ageSetOn: '2026-10-09',
  goalWeightKg: null,
  goalDate: null,
  climate: 'warm',
  proteinGPerKg: 1.6,
  fatShare: 0.3,
  movementGoalMin: 30,
  usualSleepStart: '23:00',
  usualSleepEnd: '07:00',
  usualNapStart: null,
  usualNapEnd: null,
  waistEnabled: false,
  waistReminderDay: null,
  symptomsEnabled: false,
  intimateEnabled: false,
  expenditureFactor: 1,
} as const;
