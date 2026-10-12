/** @jest-environment node */
import { isNull } from 'drizzle-orm';
import { newRecord } from '../db/record';
import { weightEntry } from '../db/schema';
import { createTestDb } from '../db/test-db';
import type { Db, RecordEnv } from '../db/types';
import { type ApiClient, InvalidCredentialsError, SignedOutError } from './api-client';
import { SyncController } from './sync-controller';

const oscar = { userId: '01926f3a-8b7c-7def-8123-000000000001', email: 'oscar@kawsay.test' };
const otherPhoneWeight = {
  id: '01926f3a-8b7c-7def-8123-0000000000aa',
  updatedAt: 1_000,
  deletedAt: null,
  date: '2026-10-08',
  loggedAt: 1_000,
  timeZone: 'America/Lima',
  kg: 80.4,
};

function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 9, 12);
  let counter = 0;
  return { now: () => (now += 1000), randomBytes: (n) => new Uint8Array(n).fill(++counter) };
}

function client(overrides: Partial<ApiClient['sync']> & Partial<Omit<ApiClient, 'sync'>> = {}) {
  const pushed: unknown[] = [];
  const api: ApiClient = {
    signIn: overrides.signIn ?? (() => Promise.resolve(oscar)),
    signOut: overrides.signOut ?? (() => Promise.resolve()),
    analyze: overrides.analyze ?? (() => Promise.reject(new Error('not in these tests'))),
    sync: {
      push:
        overrides.push ??
        ((changes) => {
          pushed.push(...changes);
          return Promise.resolve({ applied: changes.length });
        }),
      pull:
        overrides.pull ??
        ((since) =>
          Promise.resolve(
            since === 0
              ? {
                  changes: [{ collection: 'weight_entry', record: otherPhoneWeight }],
                  cursor: 1,
                  more: false,
                }
              : { changes: [], cursor: since, more: false },
          )),
    },
  };
  return { api, pushed };
}

async function logWeight(db: Db, e: RecordEnv) {
  const record = newRecord(e);
  await db.insert(weightEntry).values({
    ...record,
    date: '2026-10-09',
    kg: 80,
    loggedAt: record.updatedAt,
    timeZone: 'America/Lima',
  });
}

describe('SyncController (F02)', () => {
  it('signing in brings the history down and pushes what the phone had', async () => {
    const db = await createTestDb();
    const e = env();
    await logWeight(db, e);
    const { api, pushed } = client();
    const controller = new SyncController(db, e, api);
    await controller.start();
    expect(controller.current.account).toEqual({ kind: 'undecided' });

    expect(await controller.signIn('oscar@kawsay.test', 'pw')).toBe('ok');
    expect(pushed).toHaveLength(1);
    expect(await db.select().from(weightEntry).where(isNull(weightEntry.deletedAt))).toHaveLength(
      2,
    );
    expect(controller.current).toMatchObject({
      account: { kind: 'signed-in', email: oscar.email },
      status: 'idle',
      pending: 0,
    });
  });

  it('a wrong password or no signal at sign-in leaves the phone undecided', async () => {
    const db = await createTestDb();
    const wrong = new SyncController(
      db,
      env(),
      client({ signIn: () => Promise.reject(new InvalidCredentialsError()) }).api,
    );
    expect(await wrong.signIn('a@b.c', 'x')).toBe('invalid');
    const offline = new SyncController(
      db,
      env(),
      client({ signIn: () => Promise.reject(new TypeError('Network request failed')) }).api,
    );
    expect(await offline.signIn('a@b.c', 'x')).toBe('offline');
    await offline.start();
    expect(offline.current.account).toEqual({ kind: 'undecided' });
  });

  it('without signal, entries wait and the status says offline', async () => {
    const db = await createTestDb();
    const e = env();
    const signal = { on: true };
    const { api } = client({
      push: (changes) =>
        signal.on
          ? Promise.resolve({ applied: changes.length })
          : Promise.reject(new TypeError('Network request failed')),
    });
    const controller = new SyncController(db, e, api);
    await controller.signIn('oscar@kawsay.test', 'pw');

    signal.on = false;
    await logWeight(db, e);
    await controller.sync();
    expect(controller.current).toMatchObject({ status: 'offline', pending: 1 });

    signal.on = true;
    await controller.sync();
    expect(controller.current).toMatchObject({ status: 'idle', pending: 0 });
  });

  it('a session the server ended leaves the phone working alone and says so', async () => {
    const db = await createTestDb();
    const { api } = client();
    const controller = new SyncController(db, env(), api);
    await controller.signIn('oscar@kawsay.test', 'pw');
    api.sync.pull = () => Promise.reject(new SignedOutError());
    await controller.sync();
    expect(controller.current).toMatchObject({
      status: 'session-ended',
      account: { kind: 'local-only' },
    });
  });

  it('writes are synced together once they calm down', async () => {
    jest.useFakeTimers();
    try {
      const db = await createTestDb();
      const controller = new SyncController(db, env(), client().api);
      const sync = jest.spyOn(controller, 'sync').mockResolvedValue();
      controller.schedule();
      controller.schedule();
      jest.advanceTimersByTime(4_999);
      expect(sync).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      expect(sync).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
