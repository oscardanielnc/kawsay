import { describe, expect, it } from 'vitest';
import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import {
  TextLogLimitError,
  TextLogNotFoundError,
  TextLogUnavailableError,
} from '../../domain/errors';
import { AgentModel } from '../ports/agent-model';
import { AiCallLog, type AiCallRecord } from '../ports/ai-call-log';
import { TraceSink } from '../ports/trace-sink';
import { ItemSearch } from '../ports/item-search';
import { costUsd, isPeak } from '../prices';
import { TextLogAgent, type AgentOutcome } from '../text-log-agent';
import { TEXT_LOG_DAILY_LIMIT, ProposeTextLogUseCase } from './propose-text-log.use-case';
import { TextLogFeedbackUseCase } from './text-log-feedback.use-case';

const ID = '0e7b3c1a-2f4d-4b8e-9c1a-1234567890ab';
const request = {
  text: 'almorcé lomo saltado',
  localDate: '2026-11-03',
  timeBand: 'midday' as const,
};

class MemoryCalls extends AiCallLog {
  readonly rows: (AiCallRecord & { feedback?: unknown })[] = [];
  record(call: AiCallRecord) {
    this.rows.push(call);
    return Promise.resolve();
  }
  since(userId: string, useCase: AiCallRecord['useCase'], since: Date) {
    const rows = this.rows.filter(
      (r) => r.userId === userId && r.useCase === useCase && r.createdAt >= since,
    );
    return Promise.resolve({
      count: rows.length,
      costUsd: rows.reduce((s, r) => s + r.costUsd, 0),
      oldest: rows[0]?.createdAt ?? null,
    });
  }
  all() {
    return Promise.resolve(this.rows.map((r) => ({ ...r, feedback: r.feedback ?? null })));
  }
  forgetTextBefore() {
    return Promise.resolve(0);
  }
  feedback(userId: string, id: string, feedback: unknown) {
    const row = this.rows.find((r) => r.id === id && r.userId === userId);
    if (row) row.feedback = feedback;
    return Promise.resolve(Boolean(row));
  }
}
class FakeAgent extends TextLogAgent {
  constructor(private readonly outcome: AgentOutcome | Error) {
    super({} as AgentModel, {} as ItemSearch);
  }
  override run(): Promise<AgentOutcome> {
    return this.outcome instanceof Error
      ? Promise.reject(this.outcome)
      : Promise.resolve(this.outcome);
  }
}
const model = { model: 'deepseek-flash' } as AgentModel;
/** Records what would be traced. */
class MemoryTraces extends TraceSink {
  readonly sent: AiCallRecord[] = [];
  send(call: AiCallRecord) {
    this.sent.push(call);
    return Promise.resolve();
  }
}
const traces = new MemoryTraces();
/** 15:00 UTC on a Tuesday: off-peak. */
const clock = new (class extends Clock {
  now() {
    return new Date('2026-11-03T15:00:00Z');
  }
})();
const ids = new (class extends IdGenerator {
  uuid() {
    return ID;
  }
})();
const usage = { tokensIn: 10_000, tokensCached: 8_000, tokensOut: 300 };
const ok: AgentOutcome = {
  outcome: 'ok',
  proposal: {
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
  },
  rounds: 2,
  usage,
};

describe('ProposeTextLogUseCase (F16, ADR 0024, 0026)', () => {
  it('returns the proposal with its call id and stores one ai_call row with tokens, cost, rounds and text', async () => {
    const calls = new MemoryCalls();
    const proposal = await new ProposeTextLogUseCase(
      new FakeAgent(ok),
      model,
      calls,
      clock,
      ids,
      traces,
    ).execute('u1', request);
    expect(proposal.id).toBe(ID);
    expect(calls.rows).toHaveLength(1);
    expect(calls.rows[0]).toMatchObject({
      id: ID,
      useCase: 'text-log',
      model: 'deepseek-flash',
      promptVersion: 'text-log.v2',
      tokensIn: 10_000,
      tokensCached: 8_000,
      outcome: 'ok',
      toolRounds: 2,
      inputText: 'almorcé lomo saltado',
    });
    expect(traces.sent.at(-1)?.id).toBe(ID);
    expect(calls.rows[0]!.costUsd).toBeCloseTo(costUsd('deepseek-flash', usage, clock.now()), 12);
  });

  it('an invalid outcome or a model failure is recorded and answered as unavailable', async () => {
    const calls = new MemoryCalls();
    const invalid = new ProposeTextLogUseCase(
      new FakeAgent({ outcome: 'invalid', rounds: 4, usage }),
      model,
      calls,
      clock,
      ids,
      traces,
    );
    await expect(invalid.execute('u1', request)).rejects.toBeInstanceOf(TextLogUnavailableError);
    const failing = new ProposeTextLogUseCase(
      new FakeAgent(new Error('timeout')),
      model,
      calls,
      clock,
      ids,
      traces,
    );
    await expect(failing.execute('u1', request)).rejects.toBeInstanceOf(TextLogUnavailableError);
    expect(calls.rows.map((r) => r.outcome)).toEqual(['invalid', 'error']);
  });

  it(`allows ${TEXT_LOG_DAILY_LIMIT} text logs a day, then "vuelve mañana"`, async () => {
    const calls = new MemoryCalls();
    const useCase = new ProposeTextLogUseCase(new FakeAgent(ok), model, calls, clock, ids, traces);
    for (let i = 0; i < TEXT_LOG_DAILY_LIMIT; i++) await useCase.execute('u1', request);
    await expect(useCase.execute('u1', request)).rejects.toBeInstanceOf(TextLogLimitError);
  });

  it('stops at USD 0.10 of the day even under the count', async () => {
    const calls = new MemoryCalls();
    calls.rows.push({
      ...calls.rows[0]!,
      id: 'x',
      userId: 'u1',
      useCase: 'text-log',
      costUsd: 0.1,
      createdAt: clock.now(),
    });
    const useCase = new ProposeTextLogUseCase(new FakeAgent(ok), model, calls, clock, ids, traces);
    await expect(useCase.execute('u1', request)).rejects.toBeInstanceOf(TextLogLimitError);
  });
});

describe('TextLogFeedbackUseCase', () => {
  it('editing or removing a card before saving is stored with its call as feedback', async () => {
    const calls = new MemoryCalls();
    await new ProposeTextLogUseCase(new FakeAgent(ok), model, calls, clock, ids, traces).execute(
      'u1',
      request,
    );
    const feedback = {
      entries: [{ catalogId: 'lomo-saltado', action: 'edited' as const }],
      unmatched: [],
    };
    await new TextLogFeedbackUseCase(calls).execute('u1', ID, feedback);
    expect(calls.rows[0]!.feedback).toEqual(feedback);
    await expect(
      new TextLogFeedbackUseCase(calls).execute('u2', ID, feedback),
    ).rejects.toBeInstanceOf(TextLogNotFoundError);
  });
});

describe('prices (ADR 0023 build notes)', () => {
  it('peak is 01–04 and 06–10 UTC on weekdays, and costs double', () => {
    expect(isPeak(new Date('2026-11-03T07:00:00Z'))).toBe(true);
    expect(isPeak(new Date('2026-11-03T15:00:00Z'))).toBe(false);
    expect(isPeak(new Date('2026-11-07T07:00:00Z'))).toBe(false);
    const u = { tokensIn: 1_000_000, tokensCached: 0, tokensOut: 0 };
    expect(costUsd('deepseek-flash', u, new Date('2026-11-03T07:00:00Z'))).toBeCloseTo(0.3);
    expect(costUsd('deepseek-flash', u, new Date('2026-11-03T15:00:00Z'))).toBeCloseTo(0.15);
  });
});
