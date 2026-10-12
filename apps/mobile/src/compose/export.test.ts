/** @jest-environment node */
import catalog from '@kawsay/catalog/catalog.json';
import i18n from '@/lib/i18n';
import { addMeal } from '@/features/meals/meals-db';
import { saveNote } from '@/features/notes/notes-db';
import { addIntimate } from '@/features/private/private-db';
import { saveProfile } from '@/features/profile/profile-db';
import { saveWeight } from '@/features/weight/weight-db';
import { loadCatalog } from '@/lib/db/catalog';
import { createTestDb } from '@/lib/db/test-db';
import type { Db, RecordEnv } from '@/lib/db/types';
import { buildExport, EXPORT_COLUMNS, type ExportFile } from './export';
import { exportReadme } from './export-readme';

const lima = 'America/Lima';
function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

async function seeded(): Promise<Db> {
  const db = await createTestDb();
  await loadCatalog(db, catalog);
  const e = env();
  await saveProfile(db, e, {
    sex: 'male',
    heightCm: 170,
    ageYears: 30,
    ageSetOn: '2026-10-01',
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
    intimateEnabled: true,
  });
  await saveWeight(db, e, { date: '2026-10-06', kg: 80, timeZone: lima });
  await addMeal(db, e, {
    date: '2026-10-07',
    meal: 'lunch',
    timeZone: lima,
    item: { kind: 'dish', id: 'lomo-saltado' },
    servings: 1,
  });
  await addIntimate(db, e, { date: '2026-10-07', timeZone: lima, kind: 'sex' });
  return db;
}

describe('export (F15)', () => {
  it('builds the full JSON and one CSV per module, one row per day in the range', async () => {
    const db = await seeded();
    const { files } = await buildExport(db, {
      from: '2026-10-06',
      to: '2026-10-08',
      includePrivate: false,
    });
    expect(Object.keys(files).sort()).toEqual(
      [
        'kawsay.json',
        'activities.csv',
        'checkins.csv',
        'days.csv',
        'drinks.csv',
        'meals.csv',
        'notes.csv',
        'sleep.csv',
        'symptoms.csv',
        'waist.csv',
        'weights.csv',
      ].sort(),
    );
    expect(files['days.csv']?.trim().split('\n')).toHaveLength(4);
    expect(files['meals.csv']).toContain('2026-10-07,lunch,dish,Lomo saltado');
    expect(files['weights.csv']).toContain('2026-10-06,80');
  });

  it('The export has a notes.csv with date, time and text', async () => {
    const db = await seeded();
    await saveNote(db, env(), {
      date: '2026-10-07',
      timeZone: lima,
      text: 'Creo que me dio diarrea por comer "tal cosa", pero ya pasó',
    });
    const { files } = await buildExport(db, {
      from: '2026-10-07',
      to: '2026-10-07',
      includePrivate: false,
    });
    expect(files['notes.csv']).toBe(
      'date,time,text\n2026-10-07,07:01,"Creo que me dio diarrea por comer ""tal cosa"", pero ya pasó"\n',
    );
    expect(files['kawsay.json']).toContain('"notes"');
  });

  it('the private log is exported only when explicitly selected', async () => {
    const db = await seeded();
    const without = await buildExport(db, {
      from: '2026-10-07',
      to: '2026-10-07',
      includePrivate: false,
    });
    expect(without.files['private.csv']).toBeUndefined();
    expect(without.files['kawsay.json']).not.toContain('"private"');
    const withPrivate = await buildExport(db, {
      from: '2026-10-07',
      to: '2026-10-07',
      includePrivate: true,
    });
    expect(withPrivate.files['private.csv']).toBe('date,kind\n2026-10-07,sex\n');
  });

  it('the export can be analysed by an external AI tool without extra explanation: the README explains every column', () => {
    const readme = exportReadme(i18n.t, { includePrivate: true });
    for (const file of Object.keys(EXPORT_COLUMNS) as ExportFile[]) {
      expect(readme).toContain(`## ${file}.csv`);
      for (const column of EXPORT_COLUMNS[file])
        expect(readme).toMatch(new RegExp(`^- \`${column}\`: \\S`, 'm'));
    }
    expect(readme).toContain('kawsay.json');
  });
});
