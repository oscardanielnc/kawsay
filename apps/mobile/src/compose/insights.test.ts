/** @jest-environment node */
import catalog from '@kawsay/catalog/catalog.json';
import { addDays } from '@kawsay/core/shared/local-date';
import { addCheckIn } from '@/features/checkins/checkins-db';
import { addMeal } from '@/features/meals/meals-db';
import { saveProfile } from '@/features/profile/profile-db';
import { saveWeight } from '@/features/weight/weight-db';
import { loadCatalog } from '@/lib/db/catalog';
import { createTestDb } from '@/lib/db/test-db';
import type { Db, RecordEnv } from '@/lib/db/types';
import { loadInsights } from './insights';

const lima = 'America/Lima';
const end = '2026-10-12';

function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 12, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

async function withProfile(): Promise<{ db: Db; e: RecordEnv }> {
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
    symptomsEnabled: true,
    intimateEnabled: false,
  });
  await saveWeight(db, e, { date: addDays(end, -30), kg: 80, timeZone: lima });
  return { db, e };
}

const meal = (db: Db, e: RecordEnv, date: string, m: 'breakfast' | 'lunch', id: string) =>
  addMeal(db, e, { date, meal: m, timeZone: lima, item: { kind: 'dish', id }, servings: 1 });

describe('insights (F17, F19, F20) from the local database', () => {
  it('milk in the morning and a worse belly that day or the next: the relation shows, without AI', async () => {
    const { db, e } = await withProfile();
    for (let i = 0; i < 24; i++) {
      const date = addDays(end, -i);
      const milk = i % 4 === 0;
      if (milk)
        await addMeal(db, e, {
          date,
          meal: 'breakfast',
          timeZone: lima,
          item: { kind: 'food', id: 'leche-entera' },
          grams: 250,
        });
      // Days go backwards from `end`: the day after a milk day is i − 1.
      const worse = milk || (i + 1) % 4 === 0;
      await addCheckIn(db, e, {
        date,
        timeZone: lima,
        kind: 'bloating',
        value: worse ? 'worse' : 'usual',
      });
    }
    const { relations } = await loadInsights(db, end);
    if (relations.status !== 'ok') throw new Error(`expected findings, got ${relations.status}`);
    expect(relations.findings[0]).toMatchObject({
      exposure: { kind: 'food', id: 'leche-entera', name: 'Leche fresca entera' },
      symptom: { kind: 'check', id: 'bloating' },
      direction: 'raises',
    });
  });

  it('a week of two meals a day gives the vitamins card and the week summary', async () => {
    const { db, e } = await withProfile();
    for (let i = 0; i < 7; i++) {
      const date = addDays(end, -i);
      await meal(db, e, date, 'breakfast', 'pan-con-huevo');
      await meal(db, e, date, 'lunch', 'lomo-saltado');
    }
    const { nutrients, week, sources, richest } = await loadInsights(db, end);
    expect(nutrients?.status).toBe('ok');
    expect(week.days.grey).toBe(0);
    expect(sources.ironMg?.[0]?.name).toBe('Lomo saltado');
    expect(richest.ironMg?.length).toBeGreaterThan(0);
  });
});
