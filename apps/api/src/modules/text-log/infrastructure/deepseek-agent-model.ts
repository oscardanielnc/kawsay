import { Injectable } from '@nestjs/common';
import { AppConfig } from '../../../config/app-config';
import {
  AgentModel,
  type ChatMessage,
  type ModelTurn,
  type ToolDefinition,
} from '../application/ports/agent-model';

const ENDPOINT = 'https://api.deepseek.com/chat/completions';
const TIMEOUT_MS = 45_000;

/** A failed model call, by kind only: prompts carry health data (ADR 0013). */
export class ModelCallError extends Error {
  constructor(kind: string) {
    super(`model call failed: ${kind}`);
    this.name = 'ModelCallError';
  }
}

interface WireMessage {
  role: string;
  content: string | null;
  reasoning_content?: string;
  extra_content?: Record<string, unknown>;
  tool_calls?: {
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
    extra_content?: Record<string, unknown>;
  }[];
  tool_call_id?: string;
}

export interface ChatToolsOptions {
  endpoint: string;
  apiKey: string | null;
  model: string;
  /** Provider-specific body fields, e.g. `reasoning_effort`. */
  extra?: Record<string, unknown>;
}

/**
 * Any OpenAI-compatible chat API with `tools` (DeepSeek, Gemini's compatibility endpoint): one step per call; the
 * thinking text, when the provider returns one, is sent back on the next round.
 */
export class ChatToolsModel extends AgentModel {
  /** Replaced in tests. */
  fetchImpl: typeof fetch = (input, init) => fetch(input, init);

  constructor(private readonly options: ChatToolsOptions) {
    super();
  }

  get model(): string {
    return this.options.model;
  }

  async step(
    messages: readonly ChatMessage[],
    tools: readonly ToolDefinition[],
  ): Promise<ModelTurn> {
    const key = this.options.apiKey;
    if (!key) throw new ModelCallError('disabled');
    let response: Response;
    try {
      response = await this.fetchImpl(this.options.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: this.model,
          ...this.options.extra,
          tool_choice: 'auto',
          tools: tools.map((t) => ({
            type: 'function',
            function: { name: t.name, description: t.description, parameters: t.parameters },
          })),
          messages: messages.map(toWire),
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new ModelCallError(error instanceof Error ? error.name : 'unknown');
    }
    if (!response.ok) throw new ModelCallError(`HTTP ${response.status}`);
    const body = (await response.json()) as {
      choices?: { message?: WireMessage }[];
      usage?: {
        prompt_tokens?: number;
        prompt_cache_hit_tokens?: number;
        completion_tokens?: number;
      };
    };
    const message = body.choices?.[0]?.message;
    if (!message) throw new ModelCallError('empty');
    return {
      message: {
        role: 'assistant',
        content: message.content ?? null,
        ...(message.reasoning_content && { reasoning: message.reasoning_content }),
        ...(message.extra_content && { extra: message.extra_content }),
        ...(message.tool_calls?.length && {
          toolCalls: message.tool_calls.map((c) => ({
            id: c.id,
            name: c.function.name,
            arguments: c.function.arguments,
            ...(c.extra_content && { extra: c.extra_content }),
          })),
        }),
      },
      usage: {
        tokensIn: body.usage?.prompt_tokens ?? 0,
        tokensCached: body.usage?.prompt_cache_hit_tokens ?? 0,
        tokensOut: body.usage?.completion_tokens ?? 0,
      },
    };
  }
}

function toWire(message: ChatMessage): WireMessage {
  if (message.role === 'tool')
    return { role: 'tool', content: message.content, tool_call_id: message.toolCallId };
  if (message.role === 'assistant')
    return {
      role: 'assistant',
      content: message.content,
      ...(message.reasoning && { reasoning_content: message.reasoning }),
      ...(message.extra && { extra_content: message.extra }),
      ...(message.toolCalls?.length && {
        tool_calls: message.toolCalls.map((c) => ({
          id: c.id,
          type: 'function' as const,
          function: { name: c.name, arguments: c.arguments },
          ...(c.extra && { extra_content: c.extra }),
        })),
      }),
    };
  return { role: message.role, content: message.content };
}

/** DeepSeek for the API (ADR 0023 build notes): low reasoning effort. */
@Injectable()
export class DeepSeekAgentModel extends ChatToolsModel {
  constructor(config: AppConfig) {
    super({
      endpoint: ENDPOINT,
      apiKey: config.ai.deepseekApiKey,
      model: config.ai.model,
      extra: { reasoning_effort: 'low' },
    });
  }
}
