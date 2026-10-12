import { describe, expect, it } from 'vitest';
import { Analysis, AnalysisRequest } from './insights';

const request = {
  period: { from: '2026-09-01', to: '2026-10-12', loggedDays: 24 },
  findings: [
    {
      exposure: 'Leche fresca entera',
      effect: 'más hinchazón',
      exposedBad: 6,
      exposedDays: 8,
      baselineBad: 2,
      baselineDays: 16,
      confidence: 'medium',
    },
  ],
  week: {
    green: 4,
    yellow: 2,
    red: 1,
    movementMinutes: 120,
    lowNutrients: [{ name: 'Fibra', percent: 55 }],
  },
  notes: [{ date: '2026-10-11', text: 'Creo que me dio diarrea por comer ceviche' }],
};

describe('AnalysisRequest (F17)', () => {
  it('accepts the relations, the week and the notes', () => {
    expect(AnalysisRequest.parse(request)).toEqual(request);
  });

  it('carries no place for identifiers or intimate entries: unknown fields are refused', () => {
    expect(AnalysisRequest.safeParse({ ...request, userId: 'x' }).success).toBe(false);
    expect(AnalysisRequest.safeParse({ ...request, intimate: [] }).success).toBe(false);
  });
});

describe('Analysis (the AI answer)', () => {
  it('a confidence outside low · medium · high is refused, so the phone never shows made-up levels', () => {
    const answer = {
      summary: 'Resumen',
      findings: [{ title: 'Leche', explanation: 'x', confidence: 'certain', basedOn: 'data' }],
      suggestions: [],
      warningSigns: [],
    };
    expect(Analysis.safeParse(answer).success).toBe(false);
  });
});
