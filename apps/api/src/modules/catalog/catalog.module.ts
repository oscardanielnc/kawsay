import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CatalogSource } from './application/ports/catalog-source';
import { LabelReader } from './application/ports/label-reader';
import { RecipeWriter } from './application/ports/recipe-writer';
import { CatalogDishesUseCase } from './application/use-cases/catalog-dishes.use-case';
import { ProposeDishUseCase } from './application/use-cases/propose-dish.use-case';
import { ReadLabelUseCase } from './application/use-cases/read-label.use-case';
import { DeepSeekRecipeWriter } from './infrastructure/deepseek-recipe-writer';
import { FileCatalogSource } from './infrastructure/file-catalog-source';
import { GeminiLabelReader } from './infrastructure/gemini-label-reader';
import { CatalogController } from './presentation/catalog.controller';

/** Dishes delivered by sync, AI-proposed recipes and label reading (F23 pieces 3–5, ADR 0028, ADR 0029). */
@Module({
  imports: [IdentityModule],
  controllers: [CatalogController],
  providers: [
    { provide: CatalogSource, useClass: FileCatalogSource },
    { provide: RecipeWriter, useClass: DeepSeekRecipeWriter },
    CatalogDishesUseCase,
    { provide: LabelReader, useClass: GeminiLabelReader },
    ProposeDishUseCase,
    ReadLabelUseCase,
  ],
  exports: [CatalogSource],
})
export class CatalogModule {}
