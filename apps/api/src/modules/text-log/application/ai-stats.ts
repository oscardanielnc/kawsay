import type { AiCallRecord } from './ports/ai-call-log';

export interface AiStats {
  calls: number;
  ok: number;
  costUsd: number;
  /** Entries the user saved (kept, edited or added on confirmation). */
  savedEntries: number;
  /** Cost ÷ saved entries; null before the first saved entry. */
  usdPerEntry: number | null;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  /** Share of proposals with feedback saved without any edit or removal. */
  acceptance: number | null;
  withFeedback: number;
}

type Feedback = { entries?: { action?: string }[]; unmatched?: string[] } | null;

const percentile = (sorted: number[], p: number) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)]! : null;

/** The numbers of ADR 0024 over a set of calls: $ per entry, p50/p95 latency, acceptance as is. */
export function aiStats(rows: readonly (AiCallRecord & { feedback: unknown })[]): AiStats {
  const latencies = rows.map((r) => r.latencyMs).sort((a, b) => a - b);
  const costUsd = rows.reduce((sum, r) => sum + r.costUsd, 0);
  const feedbacks = rows
    .map((r) => r.feedback as Feedback)
    .filter((f): f is NonNullable<Feedback> => f !== null && f !== undefined);
  const savedEntries = feedbacks.reduce(
    (sum, f) => sum + (f.entries ?? []).filter((e) => e.action !== 'removed').length,
    0,
  );
  const asIs = feedbacks.filter(
    (f) =>
      (f.entries ?? []).every((e) => e.action === 'kept') &&
      !(f.unmatched ?? []).includes('removed'),
  ).length;
  return {
    calls: rows.length,
    ok: rows.filter((r) => r.outcome === 'ok').length,
    costUsd,
    savedEntries,
    usdPerEntry: savedEntries ? costUsd / savedEntries : null,
    latencyP50Ms: percentile(latencies, 0.5),
    latencyP95Ms: percentile(latencies, 0.95),
    acceptance: feedbacks.length ? asIs / feedbacks.length : null,
    withFeedback: feedbacks.length,
  };
}
