/** @jest-environment node */
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { getProfile, saveProfile, type ProfileInput } from './profile-db';

function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  return { now: () => (now += 1000), randomBytes: (n) => new Uint8Array(n).fill(7) };
}

const input: ProfileInput = {
  sex: 'male',
  heightCm: 170,
  ageYears: 30,
  ageSetOn: '2026-10-08',
  goalWeightKg: 74,
  goalDate: '2026-12-31',
  climate: 'warm',
  proteinGPerKg: 1.6,
  fatShare: 0.25,
  movementGoalMin: 30,
  usualSleepStart: '23:00',
  usualSleepEnd: '07:00',
  usualNapStart: null,
  usualNapEnd: null,
  waistEnabled: true,
  waistReminderDay: 6,
  symptomsEnabled: true,
  intimateEnabled: false,
};

describe('profile (F01)', () => {
  it('there is no profile before onboarding', async () => {
    expect(await getProfile(await createTestDb())).toBeNull();
  });

  it('saves the profile with the recalibration factor at 1', async () => {
    const db = await createTestDb();
    await saveProfile(db, env(), input);
    expect(await getProfile(db)).toMatchObject({ ...input, expenditureFactor: 1 });
  });

  it('editing keeps one profile with the same id', async () => {
    const db = await createTestDb();
    const e = env();
    const first = await saveProfile(db, e, input);
    const second = await saveProfile(db, e, {
      ...input,
      climate: 'cold',
      goalWeightKg: null,
      goalDate: null,
    });
    expect(second.id).toBe(first.id);
    expect(await getProfile(db)).toMatchObject({
      id: first.id,
      climate: 'cold',
      goalWeightKg: null,
    });
  });

  it('editing never resets the recalibration factor', async () => {
    const db = await createTestDb();
    const e = env();
    await saveProfile(db, e, input);
    await saveProfile(db, e, { ...input, expenditureFactor: 0.95 });
    await saveProfile(db, e, { ...input, heightCm: 171 });
    expect((await getProfile(db))?.expenditureFactor).toBe(0.95);
  });
});
