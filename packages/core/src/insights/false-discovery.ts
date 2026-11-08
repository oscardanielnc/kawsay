/**
 * Benjamini–Hochberg adjusted p-values ("q-values"), in the input order (F17). Testing hundreds of foods against a
 * symptom makes some line up by chance; keeping only q ≤ 0.1 means at most about one in ten shown relations is a
 * coincidence.
 */
export function benjaminiHochberg(pValues: readonly number[]): number[] {
  const m = pValues.length;
  const order = pValues.map((p, index) => ({ p, index })).sort((a, b) => a.p - b.p);
  const q = new Array<number>(m);
  let running = 1;
  for (let rank = m; rank >= 1; rank--) {
    const { p, index } = order[rank - 1]!;
    running = Math.min(running, (p * m) / rank);
    q[index] = running;
  }
  return q;
}
