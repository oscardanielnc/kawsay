import { AnalysisRequest } from '@kawsay/contracts/insights';
import i18n from '@/lib/i18n';
import { buildAnalysisRequest } from './analysis-request';
import type { InsightsData } from './types';

const data: InsightsData = {
  from: '2026-10-06',
  to: '2026-10-12',
  loggedDates: [],
  strengthDays: 1,
  episodeStarts: [],
  relationsFrom: '2026-09-01',
  notes: [{ date: '2026-10-11', text: 'Creo que me dio diarrea por comer ceviche' }],
  week: {
    days: { green: 4, yellow: 2, red: 1, grey: 0 },
    movement: { minutes: 120, goalMinutes: 150 },
    weight: { kind: 'need-more', weights: 2 },
  },
  calories: { status: 'need-days', countedDays: 0, neededDays: 3 },
  nutrients: {
    status: 'ok',
    countedDays: 7,
    rows: [
      { key: 'fiberG', intake: 18, reference: 33, percent: 55, tone: 'red', coverage: 1 },
      { key: 'vitaminCMg', intake: 120, reference: 90, percent: 133, tone: 'green', coverage: 1 },
      {
        key: 'vitaminB12Ug',
        intake: 1,
        reference: 2.4,
        percent: 41,
        tone: 'incomplete',
        coverage: 0.5,
      },
    ],
  },
  sources: {},
  richest: {},
  relations: {
    status: 'ok',
    loggedDays: 24,
    findings: [
      {
        exposure: { kind: 'tag', id: 'short-sleep' },
        symptom: { kind: 'check', id: 'mood' },
        direction: 'raises',
        occurrences: 4,
        exposedDays: 4,
        exposedBad: 3,
        baselineDays: 17,
        baselineBad: 2,
        exposedRate: 0.75,
        baselineRate: 2 / 17,
        confidence: 'low',
      },
    ],
  },
};

describe('the AI analysis request (F17, ADR 0019)', () => {
  it('carries the relations in words, the week, the low nutrients and the notes, and passes the contract', () => {
    const request = buildAnalysisRequest(data, i18n.t);
    expect(AnalysisRequest.safeParse(request).success).toBe(true);
    expect(request.period).toEqual({ from: '2026-09-01', to: '2026-10-12', loggedDays: 24 });
    expect(request.findings[0]).toMatchObject({
      exposure: 'Dormir menos de 6 h',
      effect: 'peor ánimo',
      exposedBad: 3,
      exposedDays: 4,
    });
    expect(request.week.lowNutrients).toEqual([{ name: 'Fibra', percent: 55 }]);
    expect(request.notes).toEqual(data.notes);
  });

  it('without relations yet it still sends the week and the notes', () => {
    const request = buildAnalysisRequest(
      { ...data, relations: { status: 'need-days', loggedDays: 3, neededDays: 10 } },
      i18n.t,
    );
    expect(request.findings).toEqual([]);
    expect(request.period.loggedDays).toBe(3);
  });
});
