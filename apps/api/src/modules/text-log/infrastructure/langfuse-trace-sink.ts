import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../../../config/app-config';
import type { AiCallRecord } from '../application/ports/ai-call-log';
import { TraceSink } from '../application/ports/trace-sink';

/** What a masked span shows instead of meal text (ADR 0024: no meal text leaves the VM except to the AI). */
export const MASKED = '[masked]';

/**
 * Langfuse Cloud through its OpenTelemetry endpoint (OTLP/HTTP JSON, one request per AI call, no tracing runtime;
 * the legacy ingestion API is deprecated on Langfuse Cloud from 2026-11-16). Numbers only:
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

  /**
   * One call as an OTLP/HTTP JSON export (Langfuse's live ingestion path): a generation span with GenAI attributes
   * and masked content.
   */
  otlp(call: AiCallRecord) {
    const environment = this.config.tracing.environment;
    const nanos = (ms: number) => `${BigInt(ms) * 1_000_000n}`;
    const start = call.createdAt.getTime();
    const str = (key: string, value: string) => ({ key, value: { stringValue: value } });
    const int = (key: string, value: number) => ({ key, value: { intValue: String(value) } });
    const traceId = call.id.replace(/-/g, '');
    return {
      resourceSpans: [
        {
          resource: {
            attributes: [
              str('service.name', 'kawsay-api'),
              str('deployment.environment', environment),
            ],
          },
          scopeSpans: [
            {
              scope: { name: 'kawsay.ai' },
              spans: [
                {
                  traceId,
                  spanId: traceId.slice(0, 16),
                  name: `${call.useCase}.agent`,
                  kind: 3,
                  startTimeUnixNano: nanos(start),
                  endTimeUnixNano: nanos(start + call.latencyMs),
                  status: { code: call.outcome === 'ok' ? 1 : 2 },
                  attributes: [
                    str('langfuse.observation.type', 'generation'),
                    str('langfuse.trace.name', call.useCase),
                    str('langfuse.environment', environment),
                    str('langfuse.observation.input', MASKED),
                    str('langfuse.observation.output', MASKED),
                    str('langfuse.trace.input', MASKED),
                    str('langfuse.trace.output', MASKED),
                    str('gen_ai.system', 'deepseek'),
                    str('gen_ai.operation.name', 'chat'),
                    str('gen_ai.request.model', call.model),
                    int('gen_ai.usage.input_tokens', call.tokensIn),
                    int('gen_ai.usage.output_tokens', call.tokensOut),
                    str(
                      'langfuse.observation.usage_details',
                      JSON.stringify({
                        input: call.tokensIn - call.tokensCached,
                        input_cached_tokens: call.tokensCached,
                        output: call.tokensOut,
                      }),
                    ),
                    str(
                      'langfuse.observation.cost_details',
                      JSON.stringify({ total: call.costUsd }),
                    ),
                    str('langfuse.observation.metadata.prompt_version', call.promptVersion),
                    str('langfuse.observation.metadata.outcome', call.outcome),
                    int('langfuse.observation.metadata.tool_rounds', call.toolRounds),
                    int('langfuse.observation.metadata.entries', entriesOf(call.proposal)),
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  async send(call: AiCallRecord): Promise<void> {
    const keys = this.config.tracing.langfuse;
    if (!keys) return;
    try {
      const response = await this.fetchImpl(`${keys.baseUrl}/api/public/otel/v1/traces`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Basic ${Buffer.from(`${keys.publicKey}:${keys.secretKey}`).toString('base64')}`,
        },
        body: JSON.stringify(this.otlp(call)),
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
