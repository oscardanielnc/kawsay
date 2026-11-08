/** log(n!) by summing logs: n stays below a few hundred days, so no approximation is needed. */
function logFactorial(n: number): number {
  let sum = 0;
  for (let k = 2; k <= n; k++) sum += Math.log(k);
  return sum;
}

/**
 * Two-sided Fisher exact test on a 2×2 table (F17): how likely a split at least this uneven is when the exposure has
 * nothing to do with the symptom. `exposedBad`/`exposedGood` are days after the exposure, `baselineBad`/
 * `baselineGood` the days without it. Exact, so it holds with the few days a person logs.
 */
export function fisherExactP(
  exposedBad: number,
  exposedGood: number,
  baselineBad: number,
  baselineGood: number,
): number {
  const exposed = exposedBad + exposedGood;
  const bad = exposedBad + baselineBad;
  const total = exposed + baselineBad + baselineGood;
  const base =
    logFactorial(bad) +
    logFactorial(total - bad) +
    logFactorial(exposed) +
    logFactorial(total - exposed) -
    logFactorial(total);
  const probability = (x: number) =>
    Math.exp(
      base -
        logFactorial(x) -
        logFactorial(bad - x) -
        logFactorial(exposed - x) -
        logFactorial(total - bad - exposed + x),
    );
  const observed = probability(exposedBad);
  let p = 0;
  for (let x = Math.max(0, exposed + bad - total); x <= Math.min(exposed, bad); x++) {
    const px = probability(x);
    // The tolerance keeps tables as likely as the observed one despite rounding.
    if (px <= observed * (1 + 1e-7)) p += px;
  }
  return Math.min(1, p);
}
