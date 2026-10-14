/** @jest-environment node */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { listRoutines, saveRoutine } from './routines-db';
import { routineTotals, sessionOf } from './session';
import { EXERCISE_TEMPLATES, ROUTINE_TEMPLATES, routineFromTemplate } from './templates';

const bmrKcal = 1717.5;
const template = (name: string) => {
  const found = ROUTINE_TEMPLATES.find((r) => r.name === name);
  if (!found) throw new Error(`no template ${name}`);
  return found;
};

function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 9, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

describe('routine templates (F18, docs/product/routine-templates.md)', () => {
  it('offers the three templates of the doc, in its order', () => {
    expect(ROUTINE_TEMPLATES.map((r) => r.name)).toEqual([
      'Cardio en el cuarto',
      'Fuerza A',
      'Fuerza B',
    ]);
  });

  it('Cardio en el cuarto: by rounds, 20 s rest, one round of 5 circuit exercises = 5 min', () => {
    const cardio = template('Cardio en el cuarto');
    expect(cardio).toMatchObject({ byRounds: true, restSeconds: 20 });
    expect(cardio.exercises.map((e) => e.exercise.kind)).toEqual(Array(5).fill('circuit'));
    expect(routineTotals({ id: 't', ...routineFromTemplate(cardio) }, bmrKcal).minutes).toBeCloseTo(
      5,
      10,
    );
  });

  it('Logging "Cardio en el cuarto" with 3 rounds records 3 × its minutes and kcal', () => {
    const cardio = { id: 't', ...routineFromTemplate(template('Cardio en el cuarto')) };
    const one = sessionOf(cardio, { rounds: 1 }, bmrKcal);
    const three = sessionOf(cardio, { rounds: 3 }, bmrKcal);
    expect(three.minutes).toBeCloseTo(one.minutes * 3, 10);
    expect(three.kcal).toBeCloseTo(one.kcal * 3, 10);
    expect(three.met).toBeCloseTo(one.met, 10);
  });

  it('Creating a routine from the "Fuerza A" template gives the five exercises with their sets, reps and rest, editable', async () => {
    const db = await createTestDb();
    const draft = routineFromTemplate(template('Fuerza A'));
    expect(draft.id).toBeUndefined();
    await saveRoutine(db, env(), { ...draft, name: 'Mi fuerza A' });
    const [saved] = await listRoutines(db);
    expect(saved).toMatchObject({ name: 'Mi fuerza A', restSeconds: 75, byRounds: false });
    expect(saved?.exercises).toEqual([
      {
        name: 'Sentadilla a la silla con mancuerna',
        exercise: { kind: 'weights', sets: 3, reps: 12, secondsPerRep: 4, intensity: 'light' },
      },
      {
        name: 'Press de suelo, agarre neutro',
        exercise: { kind: 'weights', sets: 3, reps: 15, secondsPerRep: 3, intensity: 'light' },
      },
      {
        name: 'Remo inclinado',
        exercise: { kind: 'weights', sets: 3, reps: 15, secondsPerRep: 3, intensity: 'light' },
      },
      {
        name: 'Puente de glúteo con mancuerna',
        exercise: { kind: 'weights', sets: 3, reps: 15, secondsPerRep: 4, intensity: 'light' },
      },
      {
        name: 'Plancha de antebrazos con rodillas apoyadas',
        exercise: { kind: 'isometric', sets: 3, seconds: 30 },
      },
    ]);
  });

  it('Creating a routine from the "Fuerza B" template keeps "por lado" on the single-leg bridge, dead bug and side plank', async () => {
    const db = await createTestDb();
    await saveRoutine(db, env(), routineFromTemplate(template('Fuerza B')));
    const [saved] = await listRoutines(db);
    expect(saved).toMatchObject({ name: 'Fuerza B', restSeconds: 75, byRounds: false });
    expect(saved?.exercises).toEqual([
      {
        name: 'Puente de glúteo a una pierna',
        exercise: {
          kind: 'bodyweight',
          sets: 3,
          reps: 10,
          secondsPerRep: 3,
          intensity: 'light',
          perSide: true,
        },
      },
      {
        name: 'Peso muerto rumano',
        exercise: { kind: 'weights', sets: 3, reps: 15, secondsPerRep: 4, intensity: 'light' },
      },
      {
        name: 'Pájaro (elevación posterior)',
        exercise: { kind: 'weights', sets: 3, reps: 15, secondsPerRep: 3, intensity: 'light' },
      },
      {
        name: 'Bicho muerto',
        exercise: {
          kind: 'bodyweight',
          sets: 3,
          reps: 10,
          secondsPerRep: 3,
          intensity: 'light',
          perSide: true,
        },
      },
      {
        name: 'Plancha lateral sobre antebrazo',
        exercise: { kind: 'isometric', sets: 3, seconds: 20, perSide: true },
      },
    ]);
  });

  it('a copy is independent: editing it does not change the template', () => {
    const draft = routineFromTemplate(template('Fuerza B'));
    draft.exercises[0]!.name = 'Cambiado';
    expect(template('Fuerza B').exercises[0]?.name).toBe('Puente de glúteo a una pierna');
  });

  it('every exercise of the doc tables is in the templates with the same name', () => {
    const doc = readFileSync(
      join(__dirname, '../../../../../docs/product/routine-templates.md'),
      'utf8',
    );
    const names = [...doc.matchAll(/^\| \d+ \| ([^|]+) \|/gm)].map((m) => m[1]!.trim());
    expect(ROUTINE_TEMPLATES.flatMap((r) => r.exercises.map((e) => e.name))).toEqual(names);
  });

  it('the exercise list offers known exercises of every kind, without repeated names', () => {
    const names = EXERCISE_TEMPLATES.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
    const kinds = new Set(EXERCISE_TEMPLATES.map((e) => e.exercise.kind));
    expect([...kinds].sort()).toEqual(
      ['bodyweight', 'circuit', 'isometric', 'mobility', 'stairs', 'weights'].sort(),
    );
    expect(names.length).toBeGreaterThanOrEqual(25);
  });
});
