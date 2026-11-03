/** Lower case, no accents or punctuation, single spaces. */
function normalizeName(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface Ingredient {
  food: string;
  grams: number;
}

export interface NamedFood {
  id: string;
  name: string;
  generic?: boolean;
}

/** Ingredients with no energy worth counting: left out when the catalog has no row for them. */
const NEGLIGIBLE =
  /^(hielo|sal|pimienta|comino|oregano|especias?|palillo|colorante|esencia|bicarbonato|levadura|clavo)/;
/** Below this many grams an unknown seasoning is left out instead of failing the recipe. */
const SEASONING_G = 15;

const stem = (word: string) => (word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word);

/**
 * Models often write a readable slug ("lucuma", "clavo-de-olor") instead of the catalog id ("ins-c35"). Each
 * unknown id is matched to the food whose name holds all its words, curated before generic, shortest name first;
 * an unmatched seasoning or ice under 15 g is left out. What could not be matched stays, so the check fails it.
 */
export function resolveIds<R extends { items: readonly Ingredient[] }>(
  recipe: R,
  foods: readonly NamedFood[],
): { recipe: R; resolved: { from: string; to: string }[]; dropped: string[] } {
  const ids = new Set(foods.map((f) => f.id));
  const named = foods.map((f) => ({ ...f, words: normalizeName(f.name).split(' ').map(stem) }));
  const resolved: { from: string; to: string }[] = [];
  const dropped: string[] = [];
  const items: Ingredient[] = [];
  for (const item of recipe.items) {
    if (ids.has(item.food)) {
      items.push(item);
      continue;
    }
    const words = normalizeName(item.food.replace(/[-_]/g, ' '))
      .split(' ')
      .filter((w) => w.length > 2 && w !== 'del' && w !== 'con')
      .map(stem);
    const match = words.length
      ? named
          .filter((f) => words.every((w) => f.words.some((fw) => fw.startsWith(w))))
          .sort(
            (a, b) =>
              Number(a.generic ?? false) - Number(b.generic ?? false) ||
              a.name.length - b.name.length,
          )[0]
      : undefined;
    if (match) {
      resolved.push({ from: item.food, to: match.id });
      items.push({ ...item, food: match.id });
    } else if (
      NEGLIGIBLE.test(normalizeName(item.food)) ||
      (item.grams <= SEASONING_G && /sal|pimienta|comino|oregano/.test(item.food))
    ) {
      dropped.push(item.food);
    } else {
      items.push(item);
    }
  }
  // Two lines that became the same food add up.
  const merged = new Map<string, number>();
  for (const item of items) merged.set(item.food, (merged.get(item.food) ?? 0) + item.grams);
  return {
    recipe: { ...recipe, items: [...merged].map(([food, grams]) => ({ food, grams })) },
    resolved,
    dropped,
  };
}
