import type { TextLogProposal, TextLogRequest } from '@kawsay/contracts/text-log';
import { Injectable, Logger } from '@nestjs/common';
import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { TextLogLimitError, TextLogUnavailableError } from '../../domain/errors';
import { AgentModel } from '../ports/agent-model';
import { AiCallLog } from '../ports/ai-call-log';
import { costUsd } from '../prices';
import { TextLogAgent } from '../text-log-agent';
import { TEXT_LOG_PROMPT_VERSION } from '../text-log-prompt';

const DAY_MS = 24 * 60 * 60 * 1000;
/** ADR 0026: per user, in any 24 h. */
export const TEXT_LOG_DAILY_LIMIT = 30;
export const TEXT_LOG_DAILY_USD = 0.1;

/** Log by text (F16): limits, the agent, and one `ai_call` row per call whatever its outcome (ADR 0024). */
@Injectable()
export class ProposeTextLogUseCase {
  private readonly logger = new Logger(ProposeTextLogUseCase.name);

  constructor(
    private readonly agent: TextLogAgent,
    private readonly model: AgentModel,
    private readonly calls: AiCallLog,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(userId: string, request: TextLogRequest): Promise<TextLogProposal> {
    const started = this.clock.now();
    const recent = await this.calls.since(userId, 'text-log', new Date(started.getTime() - DAY_MS));
    if (recent.count >= TEXT_LOG_DAILY_LIMIT || recent.costUsd >= TEXT_LOG_DAILY_USD) {
      throw new TextLogLimitError(new Date((recent.oldest ?? started).getTime() + DAY_MS));
    }

    const id = this.ids.uuid();
    const base = {
      id,
      userId,
      useCase: 'text-log' as const,
      model: this.model.model,
      promptVersion: TEXT_LOG_PROMPT_VERSION,
      inputText: request.text,
      createdAt: started,
    };
    let result: Awaited<ReturnType<TextLogAgent['run']>>;
    try {
      result = await this.agent.run(userId, request);
    } catch (error) {
      // Health data never reaches a log (ADR 0013): the error's name only.
      this.logger.error(`text log failed: ${error instanceof Error ? error.name : 'unknown'}`);
      await this.calls.record({
        ...base,
        tokensIn: 0,
        tokensCached: 0,
        tokensOut: 0,
        latencyMs: this.clock.now().getTime() - started.getTime(),
        costUsd: 0,
        outcome: 'error',
        toolRounds: 0,
        proposal: null,
      });
      throw new TextLogUnavailableError();
    }

    const proposal = result.outcome === 'ok' ? { id, ...result.proposal } : null;
    await this.calls.record({
      ...base,
      ...result.usage,
      latencyMs: this.clock.now().getTime() - started.getTime(),
      costUsd: costUsd(this.model.model, result.usage, started),
      outcome: result.outcome,
      toolRounds: result.rounds,
      proposal,
    });
    if (!proposal) throw new TextLogUnavailableError();
    return proposal;
  }
}
