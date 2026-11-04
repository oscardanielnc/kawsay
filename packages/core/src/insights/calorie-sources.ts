/** Where the week's calories come from (F24): the food groups people overeat most, then the rest. */
export type CalorieBucket = 'rice' | 'flour' | 'sweets' | 'fruit' | 'other';

export const CALORIE_BUCKETS: readonly CalorieBucket[] = [
  'rice',
  'flour',
  'sweets',
  'fruit',
  'other',
];

/** What a catalog food needs to be placed in a bucket. */
export interface BucketFood {
  name: string;
  tags: readonly string[];
  /** INS 2023 code (`C18`): group C is fruit. */
  insCode: string | null;
  per100g: Readonly<Record<string, number | null>> | null;
}

/** A food is "sweets" when added sugar gives at least this share of its energy (sugar, condensed milk, soda). */
const SWEET_SHARE = 0.4;
const KCAL_PER_G_CARB = 4;
const RICE = /arroz|chaufa|tacu/i;

/** The bucket of one catalog food. Refined flour wins over sugar: a cookie is a cookie, not a sweet. */
export function foodBucket(food: BucketFood): CalorieBucket {
  if (food.tags.includes('refined-flour')) return RICE.test(food.name) ? 'rice' : 'flour';
  const kcal = food.per100g?.energyKcal ?? 0;
  const sugar = food.per100g?.addedSugarG ?? 0;
  if (kcal > 0 && (sugar * KCAL_PER_G_CARB) / kcal >= SWEET_SHARE) return 'sweets';
  if (food.insCode && /^C\d+$/.test(food.insCode)) return 'fruit';
  return 'other';
}

/** One logged food or dish, as the week's meals hold it. */
export interface LoggedItem {
  name: string;
  kcal: number;
  /** A food eaten as such. */
  food?: BucketFood;
  /** A dish with known ingredients (curated, estimated or the user's own). */
  ingredients?: readonly { food: BucketFood; grams: number }[];
  /** Fallback for a dish without ingredients (INS group S): its added sugar and refined-flour carbohydrate. */
  addedSugarG: number;
  refinedFlourG: number;
}

export interface CaloriePart {
  bucket: CalorieBucket;
  kcal: number;
  name: string;
}

/**
 * Splits one logged item into buckets. A dish is split by the energy of each ingredient; a dish without
 * ingredients by its refined-flour and added-sugar energy, the rest going to "other".
 */
export function itemParts(item: LoggedItem): CaloriePart[] {
  const { name, kcal } = item;
  if (kcal <= 0) return [];
  if (item.food) return [{ bucket: foodBucket(item.food), kcal, name }];

  const weighted = (item.ingredients ?? []).map((i) => ({
    bucket: foodBucket(i.food),
    energy: ((i.food.per100g?.energyKcal ?? 0) * i.grams) / 100,
  }));
  const total = weighted.reduce((sum, w) => sum + w.energy, 0);
  if (total > 0) {
    const by = new Map<CalorieBucket, number>();
    for (const w of weighted) by.set(w.bucket, (by.get(w.bucket) ?? 0) + (kcal * w.energy) / total);
    return [...by].map(([bucket, part]) => ({ bucket, kcal: part, name }));
  }

  const flour = Math.min(kcal, item.refinedFlourG * KCAL_PER_G_CARB);
  const sugar = Math.min(kcal - flour, item.addedSugarG * KCAL_PER_G_CARB);
  const parts: CaloriePart[] = [
    { bucket: RICE.test(name) ? 'rice' : 'flour', kcal: flour, name },
    { bucket: 'sweets', kcal: sugar, name },
    { bucket: 'other', kcal: kcal - flour - sugar, name },
  ];
  return parts.filter((p) => p.kcal > 0);
}

export interface SourceRow {
  bucket: CalorieBucket;
  /** Average per logged day. */
  kcalPerDay: number;
  /** Share of the week's calories (0–1). */
  share: number;
  /** The logged items that added most to this bucket in the week. */
  top: { name: string; kcal: number }[];
}

/** A day counts once something with calories was logged; the view needs 3 such days. */
const MIN_DAYS = 3;

/** The week's calories by bucket, largest first (F24 insight). */
export function weeklyCalorieSources(
  days: readonly (readonly CaloriePart[])[],
):
  | { status: 'need-days'; countedDays: number; neededDays: number }
  | { status: 'ok'; countedDays: number; kcalPerDay: number; rows: SourceRow[] } {
  const counted = days.filter((parts) => parts.some((p) => p.kcal > 0));
  if (counted.length < MIN_DAYS)
    return { status: 'need-days', countedDays: counted.length, neededDays: MIN_DAYS };

  const parts = counted.flat();
  const total = parts.reduce((sum, p) => sum + p.kcal, 0);
  const rows = CALORIE_BUCKETS.map((bucket): SourceRow => {
    const mine = parts.filter((p) => p.bucket === bucket);
    const kcal = mine.reduce((sum, p) => sum + p.kcal, 0);
    const byName = new Map<string, number>();
    for (const p of mine) byName.set(p.name, (byName.get(p.name) ?? 0) + p.kcal);
    return {
      bucket,
      kcalPerDay: kcal / counted.length,
      share: total > 0 ? kcal / total : 0,
      top: [...byName]
        .map(([name, k]) => ({ name, kcal: k }))
        .sort((a, b) => b.kcal - a.kcal)
        .slice(0, 3),
    };
  })
    .filter((r) => r.kcalPerDay > 0)
    .sort((a, b) => b.kcalPerDay - a.kcalPerDay);
  return { status: 'ok', countedDays: counted.length, kcalPerDay: total / counted.length, rows };
}
