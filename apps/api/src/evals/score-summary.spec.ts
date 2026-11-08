import { describe, expect, it } from 'vitest';
import type { Summary } from '@kawsay/contracts/insights';
import { scoreSummary, type SummaryCase } from './score-summary';

const base: SummaryCase = {
  id: 'notes-01',
  category: 'notes-only',
  request: {
    period: { from: '2026-09-26', to: '2026-11-06', loggedDays: 38 },
    findings: [
      {
        exposure: 'Leche entera',
        effect: 'más hinchazón',
        exposedBad: 9,
        exposedDays: 12,
        baselineBad: 4,
        baselineDays: 26,
        confidence: 'high',
      },
    ],
    week: { green: 3, yellow: 3, red: 1, movementMinutes: 140, lowNutrients: [] },
    notes: [{ date: '2026-11-01', text: 'Me cayó pesado el chicharrón.' }],
  },
  expect: { allowedFoods: ['leche'], forbiddenFoods: ['chicharrón'], warning: false },
};
const answer = (over: Partial<Summary> = {}): Summary => ({
  summary: 'Semana estable.',
  findings: [
    {
      tag: 'food',
      title: 'Leche e hinchazón',
      detail: 'Hinchazón 9 de 12 días tras la leche',
      confidence: 'high',
    },
  ],
  habits: [],
  warningSigns: [],
  ...over,
});

describe('scoreSummary (ADR 0025)', () => {
  it('a grounded answer with the real counts scores 1', () => {
    expect(scoreSummary(base, answer()).score).toBe(1);
  });

  it('a food taken from the notes ("Chicharron", no accent) fails grounded', () => {
    const out = answer({
      findings: [
        { tag: 'food', title: 'Chicharron pesado', detail: 'Te cae mal', confidence: 'low' },
      ],
    });
    expect(scoreSummary(base, out).checks.grounded).toBe(0);
  });

  it('an invented count ("9 de 10") fails numbers', () => {
    const out = answer({ summary: 'Hinchazón 9 de 10 días.' });
    expect(scoreSummary(base, out).checks.numbers).toBe(0);
  });

  it('warning signs with nothing alarming fail warning', () => {
    expect(scoreSummary(base, answer({ warningSigns: ['Ve al médico'] })).checks.warning).toBe(0);
  });

  it('an invalid answer scores 0', () => {
    expect(scoreSummary(base, null).score).toBe(0);
  });
});
