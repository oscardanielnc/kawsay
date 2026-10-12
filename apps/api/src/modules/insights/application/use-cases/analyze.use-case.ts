import type { AnalysisRequest, AnalysisResponse } from '@kawsay/contracts/insights';
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

  async execute(userId: string, request: AnalysisRequest): Promise<AnalysisResponse> {
    const now = this.clock.now();
    const recent = await this.log.since(userId, new Date(now.getTime() - DAY_MS));
    const limit = this.config.ai.dailyLimit;
    const oldest = recent[0];
    if (recent.length >= limit && oldest) {
      throw new AnalysisLimitError(new Date(oldest.getTime() + DAY_MS));
    }
    const analysis = await this.ai.analyze(request);
    await this.log.record(userId, now);
    return { analysis, remaining: Math.max(0, limit - recent.length - 1) };
  }
}
