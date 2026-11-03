import type { AiDishProposal } from '@kawsay/contracts/catalog';
import { resolveIds } from '@kawsay/core/food/resolve-ids';
import { Injectable } from '@nestjs/common';
import { Clock } from '../../../../shared/application/ports/clock';
import { DishLimitError, DishUnavailableError } from '../../domain/errors';
import { CatalogSource } from '../ports/catalog-source';
import { RecipeWriter, type DraftRecipe } from '../ports/recipe-writer';

const DAY_MS = 24 * 60 * 60 * 1000;
/** AI dishes per user in any 24 h. Counted in memory until the ai_call table exists (ADR 0024, plan A2). */
export const AI_DISH_DAILY_LIMIT = 10;
const ICONS = new Set([
  'hoja',
  'arroz',
  'plato',
  'brocheta',
  'pan',
  'huevo',
  'pescado',
  'jugo',
  'sopa',
  'nuez',
  'fruta',
  'dulce',
]);

/**
 * "Crear «…» con IA" (F07 v0.2, F23 piece 4): the AI proposes ingredients and grams over the catalog foods, readable
 * slugs are matched to catalog ids by name, and one corrected retry is allowed. The phone computes every nutrient.
 */
@Injectable()
export class ProposeDishUseCase {
  private readonly calls = new Map<string, number[]>();

  constructor(
    private readonly writer: RecipeWriter,
    private readonly source: CatalogSource,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, name: string): Promise<AiDishProposal> {
    const now = this.clock.now().getTime();
    const recent = (this.calls.get(userId) ?? []).filter((t) => t > now - DAY_MS);
    if (recent.length >= AI_DISH_DAILY_LIMIT)
      throw new DishLimitError(new Date(recent[0]! + DAY_MS));

    const { foods } = this.source.foods();
    const list = foods.map((f) => `${f.id}|${f.name}${f.unit ? `|${f.unit}` : ''}`).join('\n');
    const ids = new Set(foods.map((f) => f.id));

    let problems: string[] | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      let draft: DraftRecipe;
      try {
        draft = await this.writer.write(name, list, problems);
      } catch {
        continue;
      }
      const { recipe } = resolveIds(draft, foods);
      const unknown = recipe.items.filter((i) => !ids.has(i.food)).map((i) => i.food);
      problems = [
        ...(unknown.length ? [`ids que no están en la lista: ${unknown.join(', ')}`] : []),
        ...(recipe.items.length === 0 ? ['sin ingredientes'] : []),
      ];
      if (problems.length === 0) {
        this.calls.set(userId, [...recent, now]);
        return {
          name,
          icon: ICONS.has(recipe.icon) ? recipe.icon : 'plato',
          servings: recipe.servings,
          items: recipe.items,
        };
      }
    }
    throw new DishUnavailableError();
  }
}
