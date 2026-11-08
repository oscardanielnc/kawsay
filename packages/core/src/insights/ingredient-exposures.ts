/**
 * Below this many grams eaten, an ingredient of a dish is not counted as eaten (F17, owner 2026-11-07: "Aceituna de
 * botija", a garnish he does not notice, showed up as a relation).
 */
export const MIN_INGREDIENT_G = 25;

/**
 * The ingredients of a dish that count as eaten for the relations (F17): each one's share of the recipe weight times
 * the grams eaten, kept when it reaches `MIN_INGREDIENT_G`. Unknown grams eaten count the whole recipe as one serving.
 */
export function ingredientsEaten(
  recipe: readonly { food: string; grams: number }[],
  gramsEaten: number | null,
): string[] {
  const recipeGrams = recipe.reduce((sum, i) => sum + i.grams, 0);
  if (recipeGrams <= 0) return [];
  const eaten = gramsEaten ?? recipeGrams;
  return [
    ...new Set(
      recipe.filter((i) => (i.grams / recipeGrams) * eaten >= MIN_INGREDIENT_G).map((i) => i.food),
    ),
  ];
}
