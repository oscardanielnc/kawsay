/** @jest-environment node */
import { createTestDb } from '../db/test-db';
import { meta, syncOutbox } from '../db/schema';
import {
  chooseLocalOnly,
  forgetAccount,
  markSynced,
  readAccount,
  rememberAccount,
} from './account';

const oscar = { userId: '01926f3a-8b7c-7def-8123-000000000001', email: 'oscar@kawsay.test' };

describe('account on this phone', () => {
  it('a fresh install has not decided yet', async () => {
    expect(await readAccount(await createTestDb())).toEqual({ kind: 'undecided' });
  });

  it('signed in, then synced', async () => {
    const db = await createTestDb();
    await rememberAccount(db, oscar);
    await markSynced(db, 1_000);
    expect(await readAccount(db)).toEqual({ kind: 'signed-in', ...oscar, lastSyncedAt: 1_000 });
  });

  it('using it without an account, then signing out later, both keep the phone working alone', async () => {
    const db = await createTestDb();
    await chooseLocalOnly(db);
    expect(await readAccount(db)).toEqual({ kind: 'local-only' });
    await rememberAccount(db, oscar);
    await forgetAccount(db);
    expect(await readAccount(db)).toEqual({ kind: 'local-only' });
  });

  it('signing in again to the same account does not start over', async () => {
    const db = await createTestDb();
    await rememberAccount(db, oscar);
    await db.insert(meta).values({ key: 'sync.cursor', value: '42' });
    await db.insert(syncOutbox).values({ collection: 'weight_entry', recordId: 'x' });
    await forgetAccount(db);
    await rememberAccount(db, oscar);
    expect(await db.select().from(meta)).toContainEqual({ key: 'sync.cursor', value: '42' });
    expect(await db.select().from(syncOutbox)).toHaveLength(1);
  });
});
