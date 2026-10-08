/** @jest-environment node */
import { addActivity, setNoActivity } from '@/features/activity/activity-db';
import { saveProfile } from '@/features/profile/profile-db';
import { saveSleep } from '@/features/sleep/sleep-db';
import { saveWeight } from '@/features/weight/weight-db';
import { createTestDb } from '@/lib/db/test-db';
import type { Db, RecordEnv } from '@/lib/db/types';
import { loadDay, summarizeDay } from './day';

const day = '2026-10-08';
const lima = 'America/Lima';
function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}
const profile = {
  sex: 'female' as const,
  heightCm: 160,
  ageYears: 35,
  ageSetOn: day,
  goalWeightKg: null,
  goalDate: null,
  climate: 'warm' as const,
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
};

async function seeded(): Promise<{ db: Db; e: RecordEnv }> {
  const db = await createTestDb();
  const e = env();
  await saveProfile(db, e, profile);
  await saveWeight(db, e, { date: '2026-10-01', kg: 70, timeZone: lima });
  return { db, e };
}

describe('a day composed from every feature (ADR 0017)', () => {
  it('a day without entries is grey, not red (F14)', async () => {
    const { db } = await seeded();
    const summary = summarizeDay(await loadDay(db, day));
    expect(summary).toMatchObject({ hasEntries: false, colour: 'grey', ring: { done: 0 } });
    expect(summary.targets).not.toBeNull();
  });

  it('"No physical activity" alone logs the day but leaves calories and protein out: red', async () => {
    const { db, e } = await seeded();
    await setNoActivity(db, e, day, true);
    expect(summarizeDay(await loadDay(db, day))).toMatchObject({ hasEntries: true, colour: 'red' });
  });

  it('activity raises the target and a logged short night is used instead of the usual one', async () => {
    const { db, e } = await seeded();
    const before = summarizeDay(await loadDay(db, day)).targets?.targetKcal ?? 0;
    await addActivity(db, e, {
      date: day,
      timeZone: lima,
      kind: 'stairs',
      intensity: 'medium',
      minutes: 30,
      met: 6.8,
      timeBand: 'morning',
    });
    const withStairs = summarizeDay(await loadDay(db, day)).targets?.targetKcal ?? 0;
    expect(withStairs).toBeGreaterThan(before);
    await saveSleep(db, e, {
      date: day,
      kind: 'night',
      start: '01:00',
      end: '06:00',
      timeZone: lima,
      quality: 3,
      nightmares: false,
    });
    const summary = summarizeDay(await loadDay(db, day));
    expect(summary.targets?.targetKcal ?? 0).toBeGreaterThan(withStairs);
    expect(summary.ring.areas.sleep).toBe(true);
  });

  it('the calendar can pass the profile and weights once; the trend only uses weights up to the day', async () => {
    const { db } = await seeded();
    const shared = { profile: null, weights: [{ date: '2026-10-09', kg: 90 }] };
    const data = await loadDay(db, day, shared);
    expect(data.weights).toEqual([]);
  });
});
