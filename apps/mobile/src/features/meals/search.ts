export interface Searchable {
  kind: 'dish' | 'food';
  id: string;
  name: string;
  /** 'dish' for dishes; the food's source otherwise (ADR 0014). */
  source: string;
  /** An INS food outside the curated seed: listed after every curated result (F23, ADR 0021). */
  generic?: boolean;
}

/**
 * Order of the results (F06, ADR 0028): curated dishes, INS group S dishes, estimated recipes, then Peruvian foods,
 * USDA and labels.
 */
const RANK: Record<string, number> = {
  dish: 0,
  'INS-S': 0.4,
  estimated: 0.6,
  INS: 1,
  USDA: 2,
  label: 3,
};
/** Shorter words must match exactly as a prefix: one typo in "pan" is a different word. */
const TYPO_FROM_LENGTH = 4;

/** Lower case, no accents, single spaces: "Plátano  FRANCÉS" → "platano frances". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function words(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean);
}

/** Levenshtein distance, stopping early above 1: only "equal or one edit away" matters here. */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** Spanish plural → singular stem, for queries only: "tallarines" → "tallarin", "uvas" → "uva". */
function singular(word: string): string {
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1);
  return word;
}

function wordMatches(query: string, word: string): boolean {
  if (word.startsWith(query) || word.startsWith(singular(query))) return true;
  if (query.length < TYPO_FROM_LENGTH) return false;
  return withinOneEdit(query, word) || withinOneEdit(query, word.slice(0, query.length));
}

/**
 * Every query word must match some word of the name; curated results come before generic INS foods, then by rank,
 * then in catalog order.
 */
export function searchCatalog<T extends Searchable>(query: string, items: readonly T[]): T[] {
  const terms = words(query);
  if (terms.length === 0) return [];
  return items
    .map((item, index) => ({ item, index, nameWords: words(item.name) }))
    .filter(({ nameWords }) =>
      terms.every((term) => nameWords.some((word) => wordMatches(term, word))),
    )
    .sort(
      (a, b) =>
        Number(a.item.generic ?? false) - Number(b.item.generic ?? false) ||
        (RANK[a.item.source] ?? 9) - (RANK[b.item.source] ?? 9) ||
        a.index - b.index,
    )
    .map(({ item }) => item);
}
