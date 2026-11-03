/** A recipe as the AI writes it: ids checked later against the catalog (ADR 0008: no nutrients). */
export interface DraftRecipe {
  name: string;
  icon: string;
  servings: number;
  items: { food: string; grams: number }[];
}

/** The AI behind a port (ADR 0007): writes a recipe from a dish name using only the listed foods. */
export abstract class RecipeWriter {
  /** `problems`: what was wrong with the previous draft, for the one corrected retry. */
  abstract write(name: string, foodList: string, problems?: string[]): Promise<DraftRecipe>;
}
