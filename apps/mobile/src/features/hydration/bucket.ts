import type { DrinkKind } from './hydration-db';

/** What fills the bucket: the three tapped kinds plus every caloric drink from meals, as one. */
export type BucketKind = DrinkKind | 'caloric';
export type BucketGlasses = Record<BucketKind, number>;

/** Bottom to top: what is heaviest on the day's balance sinks, water floats on top. */
const BOTTOM_UP: readonly BucketKind[] = ['caloric', 'alcohol', 'zero-calorie', 'water'];

/**
 * Layers of the bucket as fractions of its height (0 bottom, 1 top). The bucket holds the daily goal; past it, it is
 * full and each kind keeps its share of everything drunk (goal 12, drunk 14, water 7 → water is half).
 */
export function bucketLayers(
  glasses: BucketGlasses,
  goalGlasses: number,
): { capacity: number; layers: { kind: BucketKind; from: number; to: number }[] } {
  const total = BOTTOM_UP.reduce((sum, kind) => sum + glasses[kind], 0);
  const capacity = Math.max(goalGlasses, total);
  const layers: { kind: BucketKind; from: number; to: number }[] = [];
  let level = 0;
  for (const kind of BOTTOM_UP) {
    if (glasses[kind] <= 0) continue;
    const to = level + glasses[kind];
    layers.push({ kind, from: level / capacity, to: to / capacity });
    level = to;
  }
  return { capacity, layers };
}
