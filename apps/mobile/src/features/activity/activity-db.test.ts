/** @jest-environment node */
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import {
  activitiesOn,
  addActivity,
  dayStatusOn,
  deleteActivity,
  setNoActivity,
} from './activity-db';

const lima = 'America/Lima';
const today = '2026-10-08';

function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}
const stairs = {
  date: today,
  timeZone: lima,
  kind: 'stairs',
  intensity: 'medium' as const,
  minutes: 30,
  met: 6.8,
  timeBand: 'morning' as const,
};

describe('activity entries (F08)', () => {
  it('logs an activity with its MET, minutes and time band', async () => {
    const db = await createTestDb();
    await addActivity(db, env(), stairs);
    expect(await activitiesOn(db, today)).toEqual([
      expect.objectContaining({
        kind: 'stairs',
        intensity: 'medium',
        minutes: 30,
        met: 6.8,
        timeBand: 'morning',
        routineId: null,
      }),
    ]);
  });

  it('"No physical activity" is stored for the day', async () => {
    const db = await createTestDb();
    await setNoActivity(db, env(), today, true);
    expect(await dayStatusOn(db, today)).toEqual({ noActivity: true, sweatedALot: false });
  });

  it('logging an activity clears "No physical activity" (F08)', async () => {
    const db = await createTestDb();
    const e = env();
    await setNoActivity(db, e, today, true);
    await addActivity(db, e, stairs);
    expect((await dayStatusOn(db, today)).noActivity).toBe(false);
  });

  it('a day without a status is neither flagged nor sweaty', async () => {
    expect(await dayStatusOn(await createTestDb(), today)).toEqual({
      noActivity: false,
      sweatedALot: false,
    });
  });

  it('removing an activity is a tombstone', async () => {
    const db = await createTestDb();
    const e = env();
    const { id } = await addActivity(db, e, stairs);
    await deleteActivity(db, e, id);
    expect(await activitiesOn(db, today)).toEqual([]);
  });
});
