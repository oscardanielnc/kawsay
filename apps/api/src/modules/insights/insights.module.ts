import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AiPort } from './application/ports/ai-port';
import { AnalysisLog } from './application/ports/analysis-log';
import { AnalyzeUseCase } from './application/use-cases/analyze.use-case';
import { DeepSeekAdapter } from './infrastructure/deepseek.adapter';
import { PrismaAnalysisLog } from './infrastructure/prisma-analysis-log';
import { InsightsController } from './presentation/insights.controller';

/** On-demand AI analysis of the phone's relations and notes (F17, ADR 0007, 0019). */
@Module({
  imports: [IdentityModule],
  controllers: [InsightsController],
  providers: [
    { provide: AiPort, useClass: DeepSeekAdapter },
    { provide: AnalysisLog, useClass: PrismaAnalysisLog },
    AnalyzeUseCase,
  ],
})
export class InsightsModule {}
