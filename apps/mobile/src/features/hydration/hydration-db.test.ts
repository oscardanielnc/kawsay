/** @jest-environment node */
import { dayStatusOn } from '@/lib/db/day-status';
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { addDrink, deleteDrink, drinksOn, setSweatedALot } from './hydration-db';

const today = '2026-10-08';
function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

describe('drinks tapped in hydration (F10)', () => {
  it('stores water, zero-calorie and alcohol with their volume', async () => {
    const db = await createTestDb();
    const e = env();
    await addDrink(db, e, { date: today, timeZone: 'America/Lima', kind: 'water', volumeMl: 250 });
    await addDrink(db, e, {
      date: today,
      timeZone: 'America/Lima',
      kind: 'alcohol',
      volumeMl: 330,
    });
    expect(await drinksOn(db, today)).toEqual([
      expect.objectContaining({ kind: 'water', volumeMl: 250 }),
      expect.objectContaining({ kind: 'alcohol', volumeMl: 330 }),
    ]);
  });

  it('removing a glass tombstones it', async () => {
    const db = await createTestDb();
    const { id } = await addDrink(db, env(), {
      date: today,
      timeZone: 'America/Lima',
      kind: 'water',
      volumeMl: 250,
    });
    await deleteDrink(db, env(), id);
    expect(await drinksOn(db, today)).toEqual([]);
  });

  it('"I sweated a lot today" is a flag of the day', async () => {
    const db = await createTestDb();
    await setSweatedALot(db, env(), today, true);
    expect((await dayStatusOn(db, today)).sweatedALot).toBe(true);
  });
});
