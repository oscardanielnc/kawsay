/** @jest-environment node */
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { latestWaist, saveWaist, waistsSince } from './waist-db';

function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

describe('weekly waist (F04)', () => {
  it('one value per week: measuring again that week replaces it', async () => {
    const db = await createTestDb();
    const e = env();
    await saveWaist(db, e, { date: '2026-10-05', cm: 93, timeZone: 'America/Lima' });
    await saveWaist(db, e, { date: '2026-10-08', cm: 92, timeZone: 'America/Lima' });
    expect(await waistsSince(db, '2026-09-01')).toEqual([{ weekStart: '2026-10-05', cm: 92 }]);
  });

  it('the latest measurement feeds the waist-to-height ratio', async () => {
    const db = await createTestDb();
    const e = env();
    await saveWaist(db, e, { date: '2026-09-28', cm: 94, timeZone: 'America/Lima' });
    await saveWaist(db, e, { date: '2026-10-06', cm: 92, timeZone: 'America/Lima' });
    expect(await latestWaist(db)).toEqual({ weekStart: '2026-10-05', cm: 92 });
  });
});
