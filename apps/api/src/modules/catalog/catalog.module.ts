import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CatalogSource } from './application/ports/catalog-source';
import { RecipeWriter } from './application/ports/recipe-writer';
import { CatalogDishesUseCase } from './application/use-cases/catalog-dishes.use-case';
import { ProposeDishUseCase } from './application/use-cases/propose-dish.use-case';
import { DeepSeekRecipeWriter } from './infrastructure/deepseek-recipe-writer';
import { FileCatalogSource } from './infrastructure/file-catalog-source';
import { CatalogController } from './presentation/catalog.controller';

/** Dishes delivered by sync and AI-proposed recipes (F23 pieces 4–5, F07 v0.2, ADR 0028). */
@Module({
  imports: [IdentityModule],
  controllers: [CatalogController],
  providers: [
    { provide: CatalogSource, useClass: FileCatalogSource },
    { provide: RecipeWriter, useClass: DeepSeekRecipeWriter },
    CatalogDishesUseCase,
    ProposeDishUseCase,
  ],
})
export class CatalogModule {}
