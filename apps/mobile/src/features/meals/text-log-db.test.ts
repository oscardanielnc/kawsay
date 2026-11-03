/** @jest-environment node */
import catalog from '@kawsay/catalog/catalog.json';
import { loadCatalog } from '@/lib/db/catalog';
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { mealsOn } from './meals-db';
import { pendingOn } from './pending-db';
import { saveTextLog } from './text-log-db';

const env = (): RecordEnv => {
  let now = Date.UTC(2026, 10, 3, 17);
  let n = 0;
  return { now: () => (now += 1000), randomBytes: (k) => new Uint8Array(k).fill(++n) };
};

describe('saveTextLog (F16 "Guardar todo")', () => {
  it('saves every card and every pending item of the proposal', async () => {
    const db = await createTestDb();
    await loadCatalog(db, catalog);
    await saveTextLog(db, env(), {
      date: '2026-11-03',
      timeZone: 'America/Lima',
      entries: [
        { meal: 'lunch', item: { kind: 'dish', id: 'lomo-saltado' }, servings: 1 },
        { meal: 'lunch', item: { kind: 'food', id: 'inca-kola' }, grams: 250 },
      ],
      pending: [{ meal: 'lunch', name: 'mazamorra de unicornio' }],
    });
    expect((await mealsOn(db, '2026-11-03')).map((m) => m.name)).toEqual([
      'Lomo saltado',
      'Inca Kola',
    ]);
    expect((await pendingOn(db, '2026-11-03')).map((p) => p.name)).toEqual([
      'mazamorra de unicornio',
    ]);
  });

  it('nothing is saved when one card fails', async () => {
    const db = await createTestDb();
    await loadCatalog(db, catalog);
    await expect(
      saveTextLog(db, env(), {
        date: '2026-11-03',
        timeZone: 'America/Lima',
        entries: [
          { meal: 'lunch', item: { kind: 'dish', id: 'lomo-saltado' }, servings: 1 },
          { meal: 'lunch', item: { kind: 'dish', id: 'no-existe' }, servings: 1 },
        ],
        pending: [],
      }),
    ).rejects.toThrow();
    expect(await mealsOn(db, '2026-11-03')).toEqual([]);
  });
});
