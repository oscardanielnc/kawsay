import { AiDishRequest, CatalogDishesQuery, LabelReadRequest } from '@kawsay/contracts/catalog';
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
import { ReadLabelUseCase } from '../application/use-cases/read-label.use-case';

@Controller('catalog')
@UseGuards(AccessTokenGuard)
export class CatalogController {
  constructor(
    private readonly catalogDishes: CatalogDishesUseCase,
    private readonly proposeDish: ProposeDishUseCase,
    private readonly readLabel: ReadLabelUseCase,
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

  /** "Leer etiqueta" (F23 piece 3, ADR 0029): the label's numbers as printed, for the user to confirm. */
  @Post('label')
  @HttpCode(HttpStatus.OK)
  label(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(LabelReadRequest)) body: LabelReadRequest,
  ) {
    return this.readLabel.execute(userId, { base64: body.imageBase64, mimeType: body.mimeType });
  }
}
