/** @jest-environment node */
import { meta } from '@/lib/db/schema';
import { createTestDb } from '@/lib/db/test-db';
import { lastAnalysis, saveAnalysis } from './analysis-store';

const summary = {
  summary: 'La leche coincide con más hinchazón.',
  findings: [],
  habits: ['Prueba leche sin lactosa dos semanas'],
  warningSigns: [],
};

describe('last AI summary on the phone (F17, ADR 0022)', () => {
  it('nothing before the first summary', async () => {
    expect(await lastAnalysis(await createTestDb())).toBeNull();
  });

  it('keeps the latest summary with when it was made and how many are left', async () => {
    const db = await createTestDb();
    await saveAnalysis(db, { summary, at: 1, remaining: 2 });
    await saveAnalysis(db, { summary: { ...summary, summary: 'Otra' }, at: 2, remaining: 1 });
    expect(await lastAnalysis(db)).toEqual({
      summary: { ...summary, summary: 'Otra' },
      at: 2,
      remaining: 1,
    });
  });

  it('a long analysis stored by the previous app reads as no summary yet', async () => {
    const db = await createTestDb();
    await db.insert(meta).values({
      key: 'insights.lastAnalysis',
      value: JSON.stringify({ analysis: { summary: 'x' }, at: 1, remaining: 2 }),
    });
    expect(await lastAnalysis(db)).toBeNull();
  });
});
