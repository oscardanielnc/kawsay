import { Analysis, Summary, type AnalysisRequest } from '@kawsay/contracts/insights';
import type { ZodType } from 'zod';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../../../config/app-config';
import { AiPort } from '../application/ports/ai-port';
import { AiDisabledError, AiUnavailableError } from '../domain/errors';
import { ANALYSIS_SYSTEM_PROMPT } from './analysis-prompt';
import { SUMMARY_SYSTEM_PROMPT } from './summary-prompt';

const ENDPOINT = 'https://api.deepseek.com/chat/completions';
const TIMEOUT_MS = 120_000;
const ATTEMPTS = 2;

/**
 * DeepSeek over its OpenAI-compatible API with JSON output (ADR 0007). The answer is validated with the contract;
 * an invalid one is asked again once. Failures are logged by kind only: prompts carry health data (ADR 0013).
 */
@Injectable()
export class DeepSeekAdapter extends AiPort {
  private readonly logger = new Logger(DeepSeekAdapter.name);
  /** Replaced in tests. */
  fetchImpl: typeof fetch = (input, init) => fetch(input, init);

  constructor(private readonly config: AppConfig) {
    super();
  }

  analyze(request: AnalysisRequest): Promise<Analysis> {
    return this.ask(Analysis, ANALYSIS_SYSTEM_PROMPT, request);
  }

  summarize(request: AnalysisRequest): Promise<Summary> {
    return this.ask(Summary, SUMMARY_SYSTEM_PROMPT, request);
  }

  private async ask<T>(schema: ZodType<T>, system: string, request: AnalysisRequest): Promise<T> {
    const key = this.config.ai.deepseekApiKey;
    if (!key) throw new AiDisabledError();
    const messages: Message[] = [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(request) },
    ];
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      const content = await this.complete(key, messages);
      const parsed = schema.safeParse(parseJson(content));
      if (parsed.success) return parsed.data;
      this.logger.warn(`invalid AI output (attempt ${attempt})`);
      // The retry says what broke the contract (paths and limits only), so the model fixes it instead of repeating
      // it: 30% of summaries had a habit over 80 characters (summary evals, 2026-11-07).
      messages.push(
        { role: 'assistant', content },
        {
          role: 'user',
          content: `Tu respuesta no cumple el formato: ${parsed.error.issues
            .map((i) => `${i.path.join('.') || 'raíz'}: ${i.message}`)
            .join('; ')}. Responde de nuevo el JSON completo, corrigiendo solo eso.`,
        },
      );
    }
    throw new AiUnavailableError();
  }

  private async complete(key: string, messages: Message[]): Promise<string> {
    let response: Response;
    try {
      response = await this.fetchImpl(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: this.config.ai.model,
          response_format: { type: 'json_object' },
          messages,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error(`AI request failed: ${error instanceof Error ? error.name : 'unknown'}`);
      throw new AiUnavailableError();
    }
    if (!response.ok) {
      this.logger.error(`AI request failed: HTTP ${response.status}`);
      throw new AiUnavailableError();
    }
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return body.choices?.[0]?.message?.content ?? '';
  }
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
