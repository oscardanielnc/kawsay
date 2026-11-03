import type { AiCallRecord } from './ai-call-log';

/** Where each AI call is traced besides `ai_call` (ADR 0024). Never throws: tracing must not break a request. */
export abstract class TraceSink {
  abstract send(call: AiCallRecord): Promise<void>;
}
