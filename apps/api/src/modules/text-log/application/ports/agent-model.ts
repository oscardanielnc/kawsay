/** One message of an OpenAI-compatible chat with tools (ADR 0023 build notes). */
export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | {
      role: 'assistant';
      content: string | null;
      toolCalls?: ToolCall[];
      /** DeepSeek's thinking text, sent back unchanged on the next round. */
      reasoning?: string;
      /** Provider fields to send back as they came (Gemini's thought signatures). */
      extra?: Record<string, unknown>;
    }
  | { role: 'tool'; toolCallId: string; content: string };

export interface ToolCall {
  id: string;
  name: string;
  /** JSON as the model wrote it: may be invalid. */
  arguments: string;
  /** Provider fields of this call, sent back as they came. */
  extra?: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ModelUsage {
  tokensIn: number;
  tokensCached: number;
  tokensOut: number;
}

/** One round of the model: its answer and what it cost. */
export interface ModelTurn {
  message: Extract<ChatMessage, { role: 'assistant' }>;
  usage: ModelUsage;
}

/** The AI behind a port (ADR 0007): one chat step with tools. The loop lives in the application. */
export abstract class AgentModel {
  abstract readonly model: string;
  abstract step(
    messages: readonly ChatMessage[],
    tools: readonly ToolDefinition[],
  ): Promise<ModelTurn>;
}
