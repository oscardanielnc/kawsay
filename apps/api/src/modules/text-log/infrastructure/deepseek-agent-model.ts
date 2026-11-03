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
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

/**
 * DeepSeek over its OpenAI-compatible API (ADR 0023 build notes): `tools` with `tool_choice: auto`, low reasoning
 * effort; the thinking text is sent back on the next round as the API expects.
 */
@Injectable()
export class DeepSeekAgentModel extends AgentModel {
  /** Replaced in tests. */
  fetchImpl: typeof fetch = (input, init) => fetch(input, init);

  constructor(private readonly config: AppConfig) {
    super();
  }

  get model(): string {
    return this.config.ai.model;
  }

  async step(
    messages: readonly ChatMessage[],
    tools: readonly ToolDefinition[],
  ): Promise<ModelTurn> {
    const key = this.config.ai.deepseekApiKey;
    if (!key) throw new ModelCallError('disabled');
    let response: Response;
    try {
      response = await this.fetchImpl(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: this.model,
          reasoning_effort: 'low',
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
        ...(message.tool_calls?.length && {
          toolCalls: message.tool_calls.map((c) => ({
            id: c.id,
            name: c.function.name,
            arguments: c.function.arguments,
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
      ...(message.toolCalls?.length && {
        tool_calls: message.toolCalls.map((c) => ({
          id: c.id,
          type: 'function' as const,
          function: { name: c.name, arguments: c.arguments },
        })),
      }),
    };
  return { role: message.role, content: message.content };
}
