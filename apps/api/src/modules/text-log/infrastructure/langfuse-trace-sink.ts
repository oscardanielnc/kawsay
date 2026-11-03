import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../../../config/app-config';
import type { AiCallRecord } from '../application/ports/ai-call-log';
import { TraceSink } from '../application/ports/trace-sink';

/** What a masked span shows instead of meal text (ADR 0024: no meal text leaves the VM except to the AI). */
export const MASKED = '[masked]';

/**
 * Langfuse Cloud through its public ingestion API (one HTTP call per AI call, no tracing runtime). Numbers only:
 * input and output are always masked from the API; attribute names follow the OpenTelemetry GenAI conventions so
 * another backend is one adapter away. Off without keys.
 */
@Injectable()
export class LangfuseTraceSink extends TraceSink {
  private readonly logger = new Logger(LangfuseTraceSink.name);
  /** Replaced in tests. */
  fetchImpl: typeof fetch = (input, init) => fetch(input, init);

  constructor(private readonly config: AppConfig) {
    super();
  }

  /** The ingestion batch for one call: a trace and its generation, with masked content. */
  batch(call: AiCallRecord) {
    const environment = this.config.tracing.environment;
    const start = call.createdAt.toISOString();
    const end = new Date(call.createdAt.getTime() + call.latencyMs).toISOString();
    const metadata = {
      'gen_ai.system': 'deepseek',
      'gen_ai.request.model': call.model,
      'gen_ai.usage.input_tokens': call.tokensIn,
      'gen_ai.usage.cached_input_tokens': call.tokensCached,
      'gen_ai.usage.output_tokens': call.tokensOut,
      'kawsay.prompt_version': call.promptVersion,
      'kawsay.outcome': call.outcome,
      'kawsay.tool_rounds': call.toolRounds,
      'kawsay.cost_usd': call.costUsd,
      'kawsay.entries': entriesOf(call.proposal),
    };
    return [
      {
        id: `${call.id}-t`,
        type: 'trace-create',
        timestamp: start,
        body: {
          id: call.id,
          name: call.useCase,
          timestamp: start,
          environment,
          input: MASKED,
          output: MASKED,
          tags: [call.useCase, call.outcome],
          metadata,
        },
      },
      {
        id: `${call.id}-g`,
        type: 'generation-create',
        timestamp: start,
        body: {
          id: `${call.id}-gen`,
          traceId: call.id,
          name: `${call.useCase}.agent`,
          environment,
          startTime: start,
          endTime: end,
          model: call.model,
          input: MASKED,
          output: MASKED,
          level: call.outcome === 'ok' ? 'DEFAULT' : 'ERROR',
          usageDetails: {
            input: call.tokensIn - call.tokensCached,
            input_cached_tokens: call.tokensCached,
            output: call.tokensOut,
          },
          costDetails: { total: call.costUsd },
          metadata,
        },
      },
    ];
  }

  async send(call: AiCallRecord): Promise<void> {
    const keys = this.config.tracing.langfuse;
    if (!keys) return;
    try {
      const response = await this.fetchImpl(`${keys.baseUrl}/api/public/ingestion`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Basic ${Buffer.from(`${keys.publicKey}:${keys.secretKey}`).toString('base64')}`,
        },
        body: JSON.stringify({ batch: this.batch(call) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) this.logger.warn(`trace not sent: HTTP ${response.status}`);
    } catch (error) {
      this.logger.warn(`trace not sent: ${error instanceof Error ? error.name : 'unknown'}`);
    }
  }
}

function entriesOf(proposal: unknown): number {
  const entries = (proposal as { entries?: unknown[] } | null)?.entries;
  return Array.isArray(entries) ? entries.length : 0;
}
