/** @jest-environment node */
import catalog from '@kawsay/catalog/catalog.json';
import { addDays } from '@kawsay/core/shared/local-date';
import { addActivity } from '@/features/activity/activity-db';
import { addDrink } from '@/features/hydration/hydration-db';
import { buildAnalysisRequest } from '@/features/insights/analysis-request';
import { addLab } from '@/features/liver/labs-db';
import { addMeal } from '@/features/meals/meals-db';
import { saveProfile } from '@/features/profile/profile-db';
import { saveWeight } from '@/features/weight/weight-db';
import { loadCatalog } from '@/lib/db/catalog';
import { syncOutbox } from '@/lib/db/schema';
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import i18n from '@/lib/i18n';
import { loadInsights } from './insights';
import { loadLiver } from './liver';

const lima = 'America/Lima';
const end = '2026-10-30';

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
    ageYears: 40,
    ageSetOn: end,
    goalWeightKg: 72,
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
    liverEnabled: true,
  });
  await saveWeight(db, e, { date: addDays(end, -10), kg: 80, timeZone: lima });
  return { db, e };
}

describe('Liver card (F25) from the local database', () => {
  it('Two sugary drinks in the week count 2 · meta 0 in amber; a week without sleep logs is "sin dato"', async () => {
    const { db, e } = await setup();
    for (const back of [1, 3])
      await addMeal(db, e, {
        date: addDays(end, -back),
        meal: 'lunch',
        timeZone: lima,
        item: { kind: 'food', id: 'coca-cola' },
        servings: 1,
      });
    const liver = await loadLiver(db, end);
    expect(liver?.sugaryDrinks).toEqual({ count: 2, zone: 'yellow' });
    expect(liver?.sleep).toEqual({ value: null, zone: null });
  });

  it('movement, strength days and alcohol come from what was logged', async () => {
    const { db, e } = await setup();
    await addActivity(db, e, {
      date: end,
      timeZone: lima,
      kind: 'stairs',
      intensity: null,
      minutes: 20,
      met: 6.8,
      timeBand: 'morning',
    });
    await addActivity(db, e, {
      date: addDays(end, -2),
      timeZone: lima,
      kind: 'weights',
      intensity: 'medium',
      minutes: 40,
      met: 5,
      timeBand: 'morning',
    });
    await addDrink(db, e, {
      date: end,
      timeZone: lima,
      kind: 'alcohol',
      volumeMl: 620,
      alcoholKind: 'big-beer',
      abv: 5,
    });
    const liver = await loadLiver(db, end);
    expect(liver?.movement).toEqual({ value: 80, zone: 'yellow' });
    expect(liver?.strengthDays).toEqual({ value: 1, zone: 'yellow' });
    expect(liver?.alcohol.value).toBeCloseTo(24.46, 2);
    expect(liver?.alcohol.zone).toBe('yellow');
  });

  it('No lab value appears in the sync outbox or in an AI request; FIB-4 shows on the card', async () => {
    const { db, e } = await setup();
    await addLab(db, e, { date: end, ast: 31, alt: 37, platelets: 251 });
    const outbox = await db.select().from(syncOutbox);
    expect(outbox.map((row) => row.collection)).not.toContain('lab_result');
    const request = JSON.stringify(buildAnalysisRequest(await loadInsights(db, end), i18n.t));
    for (const value of ['31', '37', '251'])
      expect(request).not.toMatch(new RegExp(`\\b${value}\\b`));
    const liver = await loadLiver(db, end);
    expect(liver?.fib4?.band).toBe('low');
  });
});
