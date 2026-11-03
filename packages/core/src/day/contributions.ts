/** Metrics a gauge shows, as the day's entries carry them. */
export type ContributionMetric =
  'kcal' | 'proteinG' | 'fatG' | 'carbsG' | 'addedSugarG' | 'refinedFlourG';

/** One logged entry of the day, with what it adds to every gauge (computed from the catalog, ADR 0008). */
export type ContributionEntry = {
  kind: 'food' | 'dish';
  itemId: string;
  name: string;
  icon: string;
  meal: string;
  servings: number | null;
  grams: number | null;
} & Record<ContributionMetric, number>;

export interface ContributionRow {
  /** `kind:itemId`: one row per food or dish. */
  id: string;
  name: string;
  icon: string;
  /** The meals it was eaten in, in the day's order. */
  meals: string[];
  /** Each portion as logged, in the day's order. */
  portions: { servings: number | null; grams: number | null }[];
  amount: number;
  /** Share of the day's total for the metric (0–1). */
  share: number;
}

/**
 * What added to one gauge (F26): the day's entries grouped by food or dish, largest first. The same food in several
 * meals is one row with the sum. Foods that add nothing are left out and counted in `omitted`.
 */
export function contributions(
  entries: readonly ContributionEntry[],
  metric: ContributionMetric,
  mealOrder: readonly string[],
): { rows: ContributionRow[]; total: number; omitted: number } {
  const mealRank = (meal: string) => {
    const i = mealOrder.indexOf(meal);
    return i === -1 ? mealOrder.length : i;
  };
  const sorted = [...entries].sort((a, b) => mealRank(a.meal) - mealRank(b.meal));
  const groups = new Map<string, ContributionRow>();
  for (const e of sorted) {
    const id = `${e.kind}:${e.itemId}`;
    const row = groups.get(id) ?? {
      id,
      name: e.name,
      icon: e.icon,
      meals: [],
      portions: [],
      amount: 0,
      share: 0,
    };
    if (!row.meals.includes(e.meal)) row.meals.push(e.meal);
    row.portions.push({ servings: e.servings, grams: e.grams });
    row.amount += e[metric];
    groups.set(id, row);
  }
  const all = [...groups.values()];
  const total = all.reduce((sum, row) => sum + row.amount, 0);
  const rows = all
    .filter((row) => row.amount > 0)
    .map((row) => ({ ...row, share: row.amount / total }))
    .sort((a, b) => b.amount - a.amount);
  return { rows, total, omitted: all.length - rows.length };
}
