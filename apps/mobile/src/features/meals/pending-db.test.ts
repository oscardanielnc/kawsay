/** @jest-environment node */
import catalog from '@kawsay/catalog/catalog.json';
import { loadDay, summarizeDay } from '@/compose/day';
import { saveProfile } from '@/features/profile/profile-db';
import { saveWeight } from '@/features/weight/weight-db';
import { loadCatalog } from '@/lib/db/catalog';
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { addPending, completePending, pendingOn } from './pending-db';

const day = '2026-10-30';
const lima = 'America/Lima';
function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 30, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

async function setup() {
  const db = await createTestDb();
  await loadCatalog(db, catalog);
  const e = env();
  await saveProfile(db, e, {
    sex: 'male',
    heightCm: 170,
    ageYears: 30,
    ageSetOn: '2026-01-01',
    goalWeightKg: null,
    goalDate: null,
    climate: 'warm',
    proteinGPerKg: 1.6,
    fatShare: 0.25,
    movementGoalMin: 30,
    usualSleepStart: '23:00',
    usualSleepEnd: '07:00',
    usualNapStart: null,
    usualNapEnd: null,
    waistEnabled: false,
    waistReminderDay: null,
    symptomsEnabled: false,
    intimateEnabled: false,
  });
  await saveWeight(db, e, { date: day, kg: 80, timeZone: lima });
  return { db, e };
}

describe('pending meals (F23 piece 1)', () => {
  it('a pending meal counts as logged but adds no nutrients', async () => {
    const { db, e } = await setup();
    await addPending(db, e, {
      date: day,
      timeZone: lima,
      meal: 'lunch',
      name: ' Pollo a la brasa ',
      portion: '¼',
    });
    await addPending(db, e, {
      date: day,
      timeZone: lima,
      meal: 'dinner',
      name: 'Tamal',
      portion: '1',
    });
    expect(await pendingOn(db, day)).toEqual([
      expect.objectContaining({ meal: 'lunch', name: 'Pollo a la brasa', portion: '¼' }),
      expect.objectContaining({ meal: 'dinner', name: 'Tamal' }),
    ]);
    const summary = summarizeDay(await loadDay(db, day));
    expect(summary.ring.areas.meals).toBe(true);
    expect(summary.eaten.kcal).toBe(0);
  });

  it("Completing a pending entry recalculates that day's totals", async () => {
    const { db, e } = await setup();
    const { id } = await addPending(db, e, {
      date: day,
      timeZone: lima,
      meal: 'lunch',
      name: 'Lomo',
      portion: '1 plato',
    });
    await completePending(db, e, id, {
      date: day,
      meal: 'lunch',
      timeZone: lima,
      item: { kind: 'dish', id: 'lomo-saltado' },
      servings: 1,
    });
    expect(await pendingOn(db, day)).toEqual([]);
    const { eaten } = summarizeDay(await loadDay(db, day));
    expect(eaten.kcal).toBeGreaterThan(400);
  });

  it('a completion that fails leaves the pending meal as it was', async () => {
    const { db, e } = await setup();
    const { id } = await addPending(db, e, {
      date: day,
      timeZone: lima,
      meal: 'lunch',
      name: 'Lomo',
      portion: '1',
    });
    await expect(
      completePending(db, e, id, {
        date: day,
        meal: 'lunch',
        timeZone: lima,
        item: { kind: 'dish', id: 'no-such-dish' },
        servings: 1,
      }),
    ).rejects.toThrow();
    expect(await pendingOn(db, day)).toHaveLength(1);
  });
});
