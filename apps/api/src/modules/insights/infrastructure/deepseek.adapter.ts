import { Analysis, type AnalysisRequest } from '@kawsay/contracts/insights';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../../../config/app-config';
import { AiPort } from '../application/ports/ai-port';
import { AiDisabledError, AiUnavailableError } from '../domain/errors';
import { ANALYSIS_SYSTEM_PROMPT } from './analysis-prompt';

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

  async analyze(request: AnalysisRequest): Promise<Analysis> {
    const key = this.config.ai.deepseekApiKey;
    if (!key) throw new AiDisabledError();
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      const content = await this.complete(key, JSON.stringify(request));
      const parsed = Analysis.safeParse(parseJson(content));
      if (parsed.success) return parsed.data;
      this.logger.warn(`invalid AI output (attempt ${attempt})`);
    }
    throw new AiUnavailableError();
  }

  private async complete(key: string, user: string): Promise<string> {
    let response: Response;
    try {
      response = await this.fetchImpl(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: this.config.ai.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
            { role: 'user', content: user },
          ],
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

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
