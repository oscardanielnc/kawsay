import { z } from 'zod';

const meal = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
const catalogId = z.string().min(1).max(80);

/**
 * Log by text (F16, ADR 0023): only the text, the local day and the time band. No user identifiers, no journal data,
 * no intimate entries (ADR 0026).
 */
export const TextLogRequest = z.strictObject({
  text: z.string().trim().min(2).max(300),
  localDate: z.iso.date(),
  timeBand: z.enum(['early', 'morning', 'midday', 'afternoon', 'night']),
});
export type TextLogRequest = z.infer<typeof TextLogRequest>;

/** How much: servings of a dish, grams, or a household unit × count (F05 portions). */
export const Portion = z.union([
  z.strictObject({ servings: z.number().positive().max(10) }),
  z.strictObject({ grams: z.number().positive().max(3000) }),
  z.strictObject({ unit: z.string().min(1).max(60), count: z.number().positive().max(20) }),
]);
export type Portion = z.infer<typeof Portion>;

export const ProposedEntry = z.strictObject({
  meal,
  kind: z.enum(['food', 'dish']),
  catalogId,
  /** The catalog's name, for the card; the phone shows its own. */
  name: z.string().min(1).max(120),
  portion: Portion,
  confidence: z.enum(['low', 'medium', 'high']),
});
export type ProposedEntry = z.infer<typeof ProposedEntry>;

/**
 * The agent's answer: entries with catalog ids and portions, items it could not find (they become pending cards), and
 * at most one question. **No nutrient, calorie or instruction field** (ADR 0008, 0026): the phone computes.
 */
export const TextLogProposal = z.strictObject({
  /** The `ai_call` id, for the feedback. */
  id: z.uuid(),
  entries: z.array(ProposedEntry).max(15),
  unmatched: z.array(z.strictObject({ meal, text: z.string().min(1).max(80) })).max(10),
  question: z
    .strictObject({
      text: z.string().min(1).max(120),
      options: z
        .array(
          z.strictObject({
            label: z.string().min(1).max(40),
            catalogId,
            kind: z.enum(['food', 'dish']),
          }),
        )
        .min(2)
        .max(4),
      /** The entry the answer replaces. */
      replaces: catalogId,
    })
    .optional(),
});
export type TextLogProposal = z.infer<typeof TextLogProposal>;

/** What the user did with each card before "Guardar todo" (ADR 0024: free labels for the evals). */
export const TextLogFeedback = z.strictObject({
  entries: z
    .array(
      z.strictObject({
        catalogId,
        action: z.enum(['kept', 'edited', 'removed', 'added']),
      }),
    )
    .max(30),
  unmatched: z.array(z.enum(['pending', 'ai-dish', 'removed'])).max(10),
});
export type TextLogFeedback = z.infer<typeof TextLogFeedback>;
