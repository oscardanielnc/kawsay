import { describe, expect, it } from 'vitest';
import { aiStats } from './ai-stats';
import type { AiCallRecord } from './ports/ai-call-log';

const row = (
  latencyMs: number,
  costUsd: number,
  feedback: unknown,
  outcome: AiCallRecord['outcome'] = 'ok',
) => ({
  id: String(latencyMs),
  userId: 'u1',
  useCase: 'text-log' as const,
  model: 'deepseek-flash',
  promptVersion: 'text-log.v1',
  tokensIn: 0,
  tokensCached: 0,
  tokensOut: 0,
  latencyMs,
  costUsd,
  outcome,
  toolRounds: 2,
  inputText: null,
  proposal: null,
  createdAt: new Date('2026-11-03T15:00:00Z'),
  feedback,
});

describe('aiStats (ADR 0024)', () => {
  it('$ per saved entry, p50/p95 latency and acceptance as is', () => {
    const stats = aiStats([
      row(1000, 0.001, { entries: [{ action: 'kept' }, { action: 'kept' }], unmatched: [] }),
      row(2000, 0.001, { entries: [{ action: 'edited' }, { action: 'removed' }], unmatched: [] }),
      row(3000, 0.001, null),
      row(9000, 0.001, null, 'error'),
    ]);
    expect(stats).toMatchObject({
      calls: 4,
      ok: 3,
      savedEntries: 3,
      withFeedback: 2,
      acceptance: 0.5,
    });
    expect(stats.usdPerEntry).toBeCloseTo(0.004 / 3);
    expect(stats.latencyP50Ms).toBe(2000);
    expect(stats.latencyP95Ms).toBe(9000);
  });

  it('no calls, no numbers', () => {
    expect(aiStats([])).toMatchObject({
      calls: 0,
      usdPerEntry: null,
      latencyP50Ms: null,
      acceptance: null,
    });
  });
});
