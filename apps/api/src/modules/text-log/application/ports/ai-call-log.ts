/** One row of `ai_call` (ADR 0024). */
export interface AiCallRecord {
  id: string;
  userId: string;
  useCase: 'text-log' | 'ai-dish';
  model: string;
  promptVersion: string;
  tokensIn: number;
  tokensCached: number;
  tokensOut: number;
  latencyMs: number;
  costUsd: number;
  outcome: 'ok' | 'invalid' | 'error';
  toolRounds: number;
  inputText: string | null;
  proposal: unknown;
  createdAt: Date;
}

export abstract class AiCallLog {
  abstract record(call: AiCallRecord): Promise<void>;
  /** Calls and their cost for one use case since a moment (limits of ADR 0026). */
  abstract since(
    userId: string,
    useCase: AiCallRecord['useCase'],
    since: Date,
  ): Promise<{ count: number; costUsd: number; oldest: Date | null }>;
  /** Stores the feedback of a call of this user; false when there is no such call. */
  abstract feedback(userId: string, id: string, feedback: unknown): Promise<boolean>;
}
