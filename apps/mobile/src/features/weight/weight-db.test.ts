/** @jest-environment node */
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { deleteWeight, saveWeight, weightsBetween } from './weight-db';

function env(start = Date.UTC(2026, 9, 8, 12)): RecordEnv {
  let now = start;
  let counter = 0;
  return {
    now: () => (now += 1000),
    randomBytes: (n) => new Uint8Array(n).fill(++counter),
  };
}
const lima = 'America/Lima';

describe('weight entries (F03)', () => {
  it('saves a weight for the day', async () => {
    const db = await createTestDb();
    await saveWeight(db, env(), { date: '2026-10-08', kg: 80.4, timeZone: lima });
    expect(await weightsBetween(db, '2026-10-01', '2026-10-31')).toEqual([
      { date: '2026-10-08', kg: 80.4 },
    ]);
  });

  it('one weight per day: saving again the same day replaces it', async () => {
    const db = await createTestDb();
    const e = env();
    const first = await saveWeight(db, e, { date: '2026-10-08', kg: 80.4, timeZone: lima });
    const second = await saveWeight(db, e, { date: '2026-10-08', kg: 79.9, timeZone: lima });
    expect(second.id).toBe(first.id);
    expect(second.updatedAt).toBeGreaterThan(first.updatedAt);
    expect(await weightsBetween(db, '2026-10-01', '2026-10-31')).toEqual([
      { date: '2026-10-08', kg: 79.9 },
    ]);
  });

  it('returns the days in order, only inside the range', async () => {
    const db = await createTestDb();
    const e = env();
    for (const [date, kg] of [
      ['2026-10-09', 80],
      ['2026-10-07', 81],
      ['2026-11-01', 79],
    ] as const) {
      await saveWeight(db, e, { date, kg, timeZone: lima });
    }
    expect((await weightsBetween(db, '2026-10-01', '2026-10-31')).map((w) => w.date)).toEqual([
      '2026-10-07',
      '2026-10-09',
    ]);
  });

  it('a deleted weight is a tombstone: hidden, and the day can be logged again', async () => {
    const db = await createTestDb();
    const e = env();
    const saved = await saveWeight(db, e, { date: '2026-10-08', kg: 80.4, timeZone: lima });
    await deleteWeight(db, e, saved.id);
    expect(await weightsBetween(db, '2026-10-01', '2026-10-31')).toEqual([]);
    const again = await saveWeight(db, e, { date: '2026-10-08', kg: 80.1, timeZone: lima });
    expect(again.id).not.toBe(saved.id);
    expect(await weightsBetween(db, '2026-10-01', '2026-10-31')).toEqual([
      { date: '2026-10-08', kg: 80.1 },
    ]);
  });
});
