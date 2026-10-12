import { AnalysisRequest } from '@kawsay/contracts/insights';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ZodValidationPipe } from '../../../shared/presentation/http/zod-validation.pipe';
import {
  AccessTokenGuard,
  CurrentUserId,
} from '../../identity/presentation/http/access-token.guard';
import { AnalyzeUseCase } from '../application/use-cases/analyze.use-case';

@Controller('insights')
@UseGuards(AccessTokenGuard)
export class InsightsController {
  constructor(private readonly analyze: AnalyzeUseCase) {}

  /** On-demand AI analysis (F17, ADR 0019). */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  run(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(AnalysisRequest)) body: AnalysisRequest,
  ) {
    return this.analyze.execute(userId, body);
  }
}
