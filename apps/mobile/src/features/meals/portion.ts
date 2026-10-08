/** Portions of a serving offered by the add sheet (F05). */
export const FRACTIONS = [
  [0.25, '¼'],
  [0.5, '½'],
  [0.75, '¾'],
  [1, '1'],
  [1.5, '1½'],
  [2, '2'],
] as const;

/** "½" for a known fraction; otherwise the number, e.g. "0.3". */
export function fractionLabel(servings: number): string {
  return (
    FRACTIONS.find(([value]) => value === servings)?.[1] ?? String(Math.round(servings * 100) / 100)
  );
}
