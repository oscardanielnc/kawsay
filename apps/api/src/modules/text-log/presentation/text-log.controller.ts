import { TextLogFeedback, TextLogRequest } from '@kawsay/contracts/text-log';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../../shared/presentation/http/zod-validation.pipe';
import {
  AccessTokenGuard,
  CurrentUserId,
} from '../../identity/presentation/http/access-token.guard';
import { ProposeTextLogUseCase } from '../application/use-cases/propose-text-log.use-case';
import { TextLogFeedbackUseCase } from '../application/use-cases/text-log-feedback.use-case';

@Controller('ai/text-log')
@UseGuards(AccessTokenGuard)
export class TextLogController {
  constructor(
    private readonly propose: ProposeTextLogUseCase,
    private readonly feedbackUseCase: TextLogFeedbackUseCase,
  ) {}

  /** Log by text (F16, ADR 0023): a proposal the phone shows as cards; nothing is saved here. */
  @Post()
  @HttpCode(HttpStatus.OK)
  run(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(TextLogRequest)) body: TextLogRequest,
  ) {
    return this.propose.execute(userId, body);
  }

  /** What the user kept, edited or removed before "Guardar todo" (ADR 0024). */
  @Post(':id/feedback')
  @HttpCode(HttpStatus.NO_CONTENT)
  async feedback(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(TextLogFeedback)) body: TextLogFeedback,
  ): Promise<void> {
    await this.feedbackUseCase.execute(userId, id, body);
  }
}
