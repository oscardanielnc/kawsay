/** @jest-environment node */
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
