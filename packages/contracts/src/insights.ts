import { z } from 'zod';

const date = z.iso.date();
const label = z.string().min(1).max(160);
const confidence = z.enum(['low', 'medium', 'high']);

/**
 * What the phone sends for an AI analysis (F17, ADR 0019): the relations it counted, a few numbers of the period and
 * the day notes as written. Labels are already in Spanish. Never intimate entries, never user identifiers.
 */
export const AnalysisRequest = z.strictObject({
  period: z.strictObject({ from: date, to: date, loggedDays: z.number().int().nonnegative() }),
  findings: z
    .array(
      z.strictObject({
        exposure: label,
        effect: label,
        exposedBad: z.number().int().nonnegative(),
        exposedDays: z.number().int().nonnegative(),
        baselineBad: z.number().int().nonnegative(),
        baselineDays: z.number().int().nonnegative(),
        confidence,
      }),
    )
    .max(20),
  week: z.strictObject({
    green: z.number().int().nonnegative(),
    yellow: z.number().int().nonnegative(),
    red: z.number().int().nonnegative(),
    movementMinutes: z.number().nonnegative(),
    lowNutrients: z
      .array(z.strictObject({ name: label, percent: z.number().nonnegative() }))
      .max(13),
  }),
  notes: z.array(z.strictObject({ date, text: z.string().min(1).max(4000) })).max(200),
});
export type AnalysisRequest = z.infer<typeof AnalysisRequest>;

/** The AI's answer, validated before it reaches the phone (ADR 0007). Spanish text. */
export const Analysis = z.strictObject({
  summary: z.string().min(1).max(800),
  findings: z
    .array(
      z.strictObject({
        title: z.string().min(1).max(160),
        explanation: z.string().min(1).max(800),
        confidence,
        basedOn: z.enum(['data', 'notes', 'both']),
      }),
    )
    .max(6),
  suggestions: z
    .array(z.strictObject({ habit: z.string().min(1).max(240), why: z.string().min(1).max(500) }))
    .max(5),
  warningSigns: z.array(z.string().min(1).max(240)).max(5),
});
export type Analysis = z.infer<typeof Analysis>;

export const AnalysisResponse = z.strictObject({
  analysis: Analysis,
  /** Analyses left in the current 24 h. */
  remaining: z.number().int().nonnegative(),
});
export type AnalysisResponse = z.infer<typeof AnalysisResponse>;

/**
 * The short AI summary (F17 redesign, ADR 0022): what `POST /insights/summary` answers. About 1,500 characters at
 * most; `Analysis` above stays for apps that still call `/insights/analyze`.
 */
export const Summary = z.strictObject({
  summary: z.string().min(1).max(220),
  findings: z
    .array(
      z.strictObject({
        tag: z.enum(['food', 'sleep', 'stress', 'activity', 'symptom']),
        title: z.string().min(1).max(60),
        detail: z.string().min(1).max(140),
        confidence,
      }),
    )
    .max(3),
  habits: z.array(z.string().min(1).max(80)).max(2),
  warningSigns: z.array(z.string().min(1).max(140)).max(3),
});
export type Summary = z.infer<typeof Summary>;

export const SummaryResponse = z.strictObject({
  summary: Summary,
  /** Summaries and analyses left in the current 24 h (they share the limit). */
  remaining: z.number().int().nonnegative(),
});
export type SummaryResponse = z.infer<typeof SummaryResponse>;
