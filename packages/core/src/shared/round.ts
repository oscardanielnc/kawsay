/** Half-up rounding to a number of decimals, for rules that classify the value the user sees. */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
