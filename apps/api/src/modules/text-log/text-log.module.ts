import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { IdentityModule } from '../identity/identity.module';
import { AgentModel } from './application/ports/agent-model';
import { AiCallLog } from './application/ports/ai-call-log';
import { ItemSearch } from './application/ports/item-search';
import { TextLogAgent } from './application/text-log-agent';
import { ProposeTextLogUseCase } from './application/use-cases/propose-text-log.use-case';
import { TextLogFeedbackUseCase } from './application/use-cases/text-log-feedback.use-case';
import { CatalogItemSearch } from './infrastructure/catalog-item-search';
import { DeepSeekAgentModel } from './infrastructure/deepseek-agent-model';
import { PrismaAiCallLog } from './infrastructure/prisma-ai-call-log';
import { TextLogController } from './presentation/text-log.controller';

/** Log by text (F16, ADR 0023, 0024, 0026): the agent, its read-only tools and the `ai_call` record. */
@Module({
  imports: [IdentityModule, CatalogModule],
  controllers: [TextLogController],
  providers: [
    { provide: AgentModel, useClass: DeepSeekAgentModel },
    { provide: ItemSearch, useClass: CatalogItemSearch },
    { provide: AiCallLog, useClass: PrismaAiCallLog },
    TextLogAgent,
    ProposeTextLogUseCase,
    TextLogFeedbackUseCase,
  ],
})
export class TextLogModule {}
