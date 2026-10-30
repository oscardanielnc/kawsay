import type {
  AnalysisRequest,
  AnalysisResponse,
  SummaryResponse,
} from '@kawsay/contracts/insights';
import { Injectable } from '@nestjs/common';
import { AppConfig } from '../../../../config/app-config';
import { Clock } from '../../../../shared/application/ports/clock';
import { AnalysisLimitError } from '../../domain/errors';
import { AiPort } from '../ports/ai-port';
import { AnalysisLog } from '../ports/analysis-log';

const DAY_MS = 24 * 60 * 60 * 1000;

/** On-demand AI analysis (F17, ADR 0019): a few per rolling 24 h; only successful ones count. */
@Injectable()
export class AnalyzeUseCase {
  constructor(
    private readonly ai: AiPort,
    private readonly log: AnalysisLog,
    private readonly clock: Clock,
    private readonly config: AppConfig,
  ) {}

  /** The long analysis, for apps older than the F17 redesign (ADR 0022). */
  async execute(userId: string, request: AnalysisRequest): Promise<AnalysisResponse> {
    const { result, remaining } = await this.limited(userId, () => this.ai.analyze(request));
    return { analysis: result, remaining };
  }

  /** The short summary (F17 redesign, ADR 0022); it shares the daily limit with the analysis. */
  async summary(userId: string, request: AnalysisRequest): Promise<SummaryResponse> {
    const { result, remaining } = await this.limited(userId, () => this.ai.summarize(request));
    return { summary: result, remaining };
  }

  private async limited<T>(
    userId: string,
    run: () => Promise<T>,
  ): Promise<{ result: T; remaining: number }> {
    const now = this.clock.now();
    const recent = await this.log.since(userId, new Date(now.getTime() - DAY_MS));
    const limit = this.config.ai.dailyLimit;
    const oldest = recent[0];
    if (recent.length >= limit && oldest) {
      throw new AnalysisLimitError(new Date(oldest.getTime() + DAY_MS));
    }
    const result = await run();
    await this.log.record(userId, now);
    return { result, remaining: Math.max(0, limit - recent.length - 1) };
  }
}
