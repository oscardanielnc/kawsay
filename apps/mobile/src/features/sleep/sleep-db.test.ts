/** @jest-environment node */
import { sessionStamps } from '@kawsay/core/sleep/sleep-session';
import { and, eq, isNull } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { sleepSession } from '@/lib/db/schema';
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { deleteSleep, saveSleep, sleepOn } from './sleep-db';

const today = '2026-10-08';
function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}
const night = {
  date: today,
  kind: 'night' as const,
  start: '23:00',
  end: '07:00',
  timeZone: 'America/Lima',
  quality: 4,
  nightmares: false,
};

describe('sleep sessions (F11)', () => {
  it('a night that crosses midnight is stored with full stamps and read back as times', async () => {
    const db = await createTestDb();
    await saveSleep(db, env(), night);
    expect(await sleepOn(db, today)).toEqual([
      expect.objectContaining({
        kind: 'night',
        start: '23:00',
        end: '07:00',
        stamps: { start: '2026-10-07T23:00', end: '2026-10-08T07:00' },
        hours: 8,
        quality: 4,
        nightmares: false,
      }),
    ]);
  });

  it('one night per day: two quick taps on the draft night save one night, not two', async () => {
    const db = await createTestDb();
    const e = env();
    await saveSleep(db, e, { ...night, quality: 3 });
    await saveSleep(db, e, { ...night, quality: 5 });
    expect(await sleepOn(db, today)).toEqual([
      expect.objectContaining({ kind: 'night', quality: 5 }),
    ]);
  });

  it('a day that already holds two nights shows one, and the next save removes the extra', async () => {
    const db = await createTestDb();
    const e = env();
    for (const quality of [2, 4]) {
      await db.insert(sleepSession).values({
        ...newRecord(e),
        ...sessionStamps(today, { start: '23:00', end: '07:00' }),
        date: today,
        kind: 'night',
        timeZone: 'America/Lima',
        quality,
        nightmares: false,
      });
    }
    expect(await sleepOn(db, today)).toEqual([expect.objectContaining({ quality: 4 })]);
    const [shown] = await sleepOn(db, today);
    await saveSleep(db, e, { ...night, id: shown?.id, quality: 1 });
    const live = await db
      .select()
      .from(sleepSession)
      .where(and(eq(sleepSession.date, today), isNull(sleepSession.deletedAt)));
    expect(live).toEqual([expect.objectContaining({ quality: 1 })]);
  });

  it('saving with an id edits that session instead of adding one', async () => {
    const db = await createTestDb();
    const e = env();
    const { id } = await saveSleep(db, e, night);
    await saveSleep(db, e, { ...night, id, end: '06:30', nightmares: true });
    const sessions = await sleepOn(db, today);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toEqual(
      expect.objectContaining({ end: '06:30', hours: 7.5, nightmares: true }),
    );
  });

  it('naps can be added and removed; the night stays', async () => {
    const db = await createTestDb();
    const e = env();
    await saveSleep(db, e, night);
    const nap = await saveSleep(db, e, {
      ...night,
      kind: 'nap',
      start: '14:00',
      end: '14:30',
      quality: null,
    });
    expect(await sleepOn(db, today)).toHaveLength(2);
    await deleteSleep(db, e, nap.id);
    expect((await sleepOn(db, today)).map((s) => s.kind)).toEqual(['night']);
  });
});
