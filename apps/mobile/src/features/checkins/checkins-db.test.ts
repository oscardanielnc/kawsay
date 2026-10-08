/** @jest-environment node */
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { addCheckIn, checkInsOn, deleteCheckIn, latestCheckIns } from './checkins-db';

const today = '2026-10-08';
function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}
const at = (kind: Parameters<typeof addCheckIn>[2]['kind'], value: string) => ({
  date: today,
  timeZone: 'America/Lima',
  kind,
  value,
});

describe('check-ins (F10)', () => {
  it('every check-in stores its time', async () => {
    const db = await createTestDb();
    await addCheckIn(db, env(), at('mood', '4'));
    const [row] = await checkInsOn(db, today);
    expect(row).toEqual(expect.objectContaining({ kind: 'mood', value: '4' }));
    expect(row?.loggedAt).toBe(Date.UTC(2026, 9, 8, 12, 1));
  });

  it('the latest value of each kind wins; bathroom keeps every visit', async () => {
    const db = await createTestDb();
    const e = env();
    await addCheckIn(db, e, at('stress', '2'));
    await addCheckIn(db, e, at('stress', '4'));
    await addCheckIn(db, e, at('bathroom', '4'));
    await addCheckIn(db, e, at('bathroom', 'gas'));
    const latest = latestCheckIns(await checkInsOn(db, today));
    expect(latest.stress).toBe('4');
    expect(latest.bathroom).toEqual(['4', 'gas']);
  });

  it('a deleted check-in is gone from the day', async () => {
    const db = await createTestDb();
    const { id } = await addCheckIn(db, env(), at('urine', 'clear'));
    await deleteCheckIn(db, env(), id);
    expect(await checkInsOn(db, today)).toEqual([]);
  });
});
