import type { Analysis, AnalysisRequest } from '@kawsay/contracts/insights';
import { describe, expect, it } from 'vitest';
import { AppConfig } from '../../../../config/app-config';
import { Clock } from '../../../../shared/application/ports/clock';
import { AnalysisLimitError } from '../../domain/errors';
import { AiPort } from '../ports/ai-port';
import { AnalysisLog } from '../ports/analysis-log';
import { AnalyzeUseCase } from './analyze.use-case';

const request: AnalysisRequest = {
  period: { from: '2026-09-01', to: '2026-10-12', loggedDays: 24 },
  findings: [],
  week: { green: 4, yellow: 2, red: 1, movementMinutes: 120, lowNutrients: [] },
  notes: [],
};
const analysis: Analysis = { summary: 'Resumen', findings: [], suggestions: [], warningSigns: [] };

class FakeAi extends AiPort {
  calls = 0;
  analyze() {
    this.calls++;
    return Promise.resolve(analysis);
  }
}
class MemoryLog extends AnalysisLog {
  readonly times: Date[] = [];
  since(_userId: string, since: Date) {
    return Promise.resolve(this.times.filter((t) => t >= since));
  }
  record(_userId: string, at: Date) {
    this.times.push(at);
    return Promise.resolve();
  }
}
class FixedClock extends Clock {
  constructor(public at: Date) {
    super();
  }
  now() {
    return this.at;
  }
}

function setup() {
  const config = new AppConfig(
    'test',
    3000,
    'postgres://x',
    {
      accessTokenSecret: 'x'.repeat(32),
      accessTokenTtlSeconds: 900,
      refreshTokenTtlDays: 90,
      loginRateLimitPerMinute: 5,
    },
    { deepseekApiKey: 'sk-test-key-of-twenty-chars', model: 'deepseek-flash', dailyLimit: 3 },
  );
  const ai = new FakeAi();
  const log = new MemoryLog();
  const clock = new FixedClock(new Date('2026-10-12T18:00:00Z'));
  return { ai, log, clock, useCase: new AnalyzeUseCase(ai, log, clock, config) };
}

describe('AnalyzeUseCase (F17)', () => {
  it('returns the AI analysis and how many are left in 24 h', async () => {
    const { useCase } = setup();
    await expect(useCase.execute('u1', request)).resolves.toEqual({ analysis, remaining: 2 });
  });

  it('A 4th analysis within 24 h is refused, without calling the AI', async () => {
    const { useCase, ai } = setup();
    for (let i = 0; i < 3; i++) await useCase.execute('u1', request);
    await expect(useCase.execute('u1', request)).rejects.toBeInstanceOf(AnalysisLimitError);
    expect(ai.calls).toBe(3);
  });

  it('the limit is a rolling 24 h: a day later there is room again', async () => {
    const { useCase, clock } = setup();
    for (let i = 0; i < 3; i++) await useCase.execute('u1', request);
    clock.at = new Date('2026-10-13T18:00:01Z');
    await expect(useCase.execute('u1', request)).resolves.toMatchObject({ remaining: 2 });
  });

  it('a failed AI call does not use up an analysis', async () => {
    const { useCase, ai, log } = setup();
    ai.analyze = () => Promise.reject(new Error('down'));
    await expect(useCase.execute('u1', request)).rejects.toThrow('down');
    expect(log.times).toEqual([]);
  });
});
