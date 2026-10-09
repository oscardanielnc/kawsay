import { z } from 'zod';
import { COLLECTIONS, type Collection, RECORD_SCHEMAS } from './records';

/** Most records per push or per pull page. */
export const SYNC_PAGE_SIZE = 500;

/** A record as it travels: its collection plus the record itself (ADR 0004, 0018). */
export const Change = z
  .strictObject({ collection: z.enum(COLLECTIONS), record: z.record(z.string(), z.unknown()) })
  .transform((change, ctx) => {
    const parsed = RECORD_SCHEMAS[change.collection].safeParse(change.record);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ ...issue, path: ['record', ...issue.path] });
      }
      return z.NEVER;
    }
    return { collection: change.collection, record: parsed.data };
  });
export type Change = {
  collection: Collection;
  record: z.infer<(typeof RECORD_SCHEMAS)[Collection]>;
};

export const PushRequest = z.strictObject({ changes: z.array(Change).max(SYNC_PAGE_SIZE) });
export type PushRequest = z.infer<typeof PushRequest>;

export const PushResponse = z.strictObject({
  /** Records stored because they were newer than the server's copy. */
  applied: z.number().int().nonnegative(),
});
export type PushResponse = z.infer<typeof PushResponse>;

/** `since` is the cursor of the previous pull (0 the first time). */
export const PullQuery = z.strictObject({
  since: z.coerce.number().int().nonnegative().default(0),
});
export type PullQuery = z.infer<typeof PullQuery>;

export const PullResponse = z.strictObject({
  changes: z.array(Change),
  /** Pass it as `since` next time. */
  cursor: z.number().int().nonnegative(),
  /** More changes wait after this page. */
  more: z.boolean(),
});
export type PullResponse = z.infer<typeof PullResponse>;
