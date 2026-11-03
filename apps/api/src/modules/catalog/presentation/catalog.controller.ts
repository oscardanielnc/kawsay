import { AiDishRequest, CatalogDishesQuery } from '@kawsay/contracts/catalog';
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
import { CatalogDishesUseCase } from '../application/use-cases/catalog-dishes.use-case';
import { ProposeDishUseCase } from '../application/use-cases/propose-dish.use-case';

@Controller('catalog')
@UseGuards(AccessTokenGuard)
export class CatalogController {
  constructor(
    private readonly catalogDishes: CatalogDishesUseCase,
    private readonly proposeDish: ProposeDishUseCase,
  ) {}

  /** Catalog by sync (F23 piece 5, ADR 0028). */
  @Get('dishes')
  dishes(@Query(new ZodValidationPipe(CatalogDishesQuery)) query: CatalogDishesQuery) {
    return this.catalogDishes.execute(query.version);
  }

  /** "Crear «…» con IA" (F07 v0.2): a proposal the phone computes and the user edits. */
  @Post('ai-dish')
  @HttpCode(HttpStatus.OK)
  aiDish(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(AiDishRequest)) body: AiDishRequest,
  ) {
    return this.proposeDish.execute(userId, body.name);
  }
}
