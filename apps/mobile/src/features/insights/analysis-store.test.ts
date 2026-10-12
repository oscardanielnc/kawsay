/** @jest-environment node */
import { createTestDb } from '@/lib/db/test-db';
import { lastAnalysis, saveAnalysis } from './analysis-store';

const analysis = {
  summary: 'La leche coincide con más hinchazón.',
  findings: [],
  suggestions: [{ habit: 'Prueba leche sin lactosa dos semanas', why: '5 de 7 días' }],
  warningSigns: [],
};

describe('last AI analysis on the phone (F17)', () => {
  it('nothing before the first analysis', async () => {
    expect(await lastAnalysis(await createTestDb())).toBeNull();
  });

  it('keeps the latest analysis with when it was made and how many are left', async () => {
    const db = await createTestDb();
    await saveAnalysis(db, { analysis, at: 1, remaining: 2 });
    await saveAnalysis(db, { analysis: { ...analysis, summary: 'Otra' }, at: 2, remaining: 1 });
    expect(await lastAnalysis(db)).toEqual({
      analysis: { ...analysis, summary: 'Otra' },
      at: 2,
      remaining: 1,
    });
  });
});
