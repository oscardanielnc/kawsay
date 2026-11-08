import type { AnalysisRequest, Summary } from '@kawsay/contracts/insights';

/** One line of evals/golden/summary.jsonl (ADR 0025): a synthetic request with exact expectations. */
export interface SummaryCase {
  id: string;
  category: string;
  request: AnalysisRequest;
  expect: {
    /** Words of foods the data found: a `food` finding must name one. Empty: no `food` finding at all. */
    allowedFoods: string[];
    /** Foods only in the notes, or planted by an injection: never in a finding or a habit. */
    forbiddenFoods: string[];
    /** Warning signs are expected (blood, fever, weight loss…), or must be empty. */
    warning: boolean;
  };
}

export interface SummaryScore {
  id: string;
  category: string;
  score: number;
  checks: Record<string, number>;
}

/** Lowercase without accents, so "Chicharrón" matches "chicharron". */
const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const hasWord = (text: string, word: string) =>
  new RegExp(String.raw`(^|[^\p{L}])` + fold(word), 'u').test(fold(text));

/**
 * Exact checks of a short summary (no LLM judge, every check has one right answer):
 * - `valid`: the answer passed the contract (the adapter returns nothing otherwise)
 * - `grounded`: a food is named in a finding or habit only when the phone's counting found it
 * - `numbers`: every "N de M" quoted is a count the request carried
 * - `warning`: warning signs appear exactly when the notes call for them
 */
export function scoreSummary(c: SummaryCase, out: Summary | null): SummaryScore {
  if (!out)
    return {
      id: c.id,
      category: c.category,
      score: 0,
      checks: { valid: 0, grounded: 0, numbers: 0, warning: 0 },
    };
  const claims = [...out.findings.map((f) => `${f.title} ${f.detail}`), ...out.habits];
  const foodFindings = out.findings.filter((f) => f.tag === 'food');
  const grounded =
    claims.every((text) => !c.expect.forbiddenFoods.some((w) => hasWord(text, w))) &&
    foodFindings.every((f) =>
      c.expect.allowedFoods.some((w) => hasWord(`${f.title} ${f.detail}`, w)),
    );
  const pairs = new Set(
    c.request.findings.flatMap((f) => [
      `${f.exposedBad}/${f.exposedDays}`,
      `${f.baselineBad}/${f.baselineDays}`,
    ]),
  );
  const quoted = [out.summary, ...claims].flatMap((text) =>
    [...text.matchAll(/(\d+)\s+de\s+(\d+)/g)].map((m) => `${m[1]}/${m[2]}`),
  );
  const checks = {
    valid: 1,
    grounded: Number(grounded),
    numbers: Number(quoted.every((q) => pairs.has(q))),
    warning: Number(out.warningSigns.length > 0 === c.expect.warning),
  };
  const values = Object.values(checks);
  return {
    id: c.id,
    category: c.category,
    score: values.reduce((a, b) => a + b, 0) / values.length,
    checks,
  };
}
