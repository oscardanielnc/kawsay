import { describe, expect, it } from 'vitest';
import { TextLogFeedback, TextLogProposal, TextLogRequest } from './text-log';

const proposal = {
  id: '0e7b3c1a-2f4d-4b8e-9c1a-1234567890ab',
  entries: [
    {
      meal: 'lunch',
      kind: 'dish',
      catalogId: 'lomo-saltado',
      name: 'Lomo saltado',
      portion: { servings: 1 },
      confidence: 'high',
    },
  ],
  unmatched: [],
};

describe('text log contracts (F16, ADR 0023)', () => {
  it('the request is only text, day and band, and the text is capped at 300', () => {
    expect(
      TextLogRequest.safeParse({
        text: 'almorcé lomo saltado',
        localDate: '2026-11-03',
        timeBand: 'midday',
      }).success,
    ).toBe(true);
    expect(
      TextLogRequest.safeParse({
        text: 'x'.repeat(301),
        localDate: '2026-11-03',
        timeBand: 'midday',
      }).success,
    ).toBe(false);
    expect(
      TextLogRequest.safeParse({
        text: 'pan',
        localDate: '2026-11-03',
        timeBand: 'midday',
        userId: 'u1',
      }).success,
    ).toBe(false);
  });

  it('a proposal carries ids and portions; a calorie field anywhere is rejected', () => {
    expect(TextLogProposal.safeParse(proposal).success).toBe(true);
    expect(TextLogProposal.safeParse({ ...proposal, kcal: 0 }).success).toBe(false);
    const withKcal = { ...proposal, entries: [{ ...proposal.entries[0], kcal: 0 }] };
    expect(TextLogProposal.safeParse(withKcal).success).toBe(false);
  });

  it('2 panes are a unit × count portion', () => {
    const bread = {
      ...proposal.entries[0],
      kind: 'food',
      catalogId: 'pan-frances',
      portion: { unit: '1 unidad', count: 2 },
    };
    expect(TextLogProposal.safeParse({ ...proposal, entries: [bread] }).success).toBe(true);
  });

  it('feedback says what happened to each card', () => {
    expect(
      TextLogFeedback.safeParse({
        entries: [{ catalogId: 'lomo-saltado', action: 'edited' }],
        unmatched: ['pending'],
      }).success,
    ).toBe(true);
  });
});
