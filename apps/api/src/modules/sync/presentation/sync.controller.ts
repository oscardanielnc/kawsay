import { PullQuery, PushRequest } from '@kawsay/contracts/sync';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../../shared/presentation/http/zod-validation.pipe';
import {
  AccessTokenGuard,
  CurrentUserId,
} from '../../identity/presentation/http/access-token.guard';
import { PullChangesUseCase } from '../application/use-cases/pull-changes.use-case';
import { PushChangesUseCase } from '../application/use-cases/push-changes.use-case';

@Controller('sync')
@UseGuards(AccessTokenGuard)
export class SyncController {
  constructor(
    private readonly pushChanges: PushChangesUseCase,
    private readonly pullChanges: PullChangesUseCase,
  ) {}

  @Post('push')
  @HttpCode(HttpStatus.OK)
  push(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(PushRequest)) body: PushRequest,
  ) {
    return this.pushChanges.execute(userId, body.changes);
  }

  @Get('pull')
  pull(@CurrentUserId() userId: string, @Query(new ZodValidationPipe(PullQuery)) query: PullQuery) {
    return this.pullChanges.execute(userId, query.since);
  }
}
