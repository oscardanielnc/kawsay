/** When each user ran an analysis: only the time, never its content (ADR 0013). */
export abstract class AnalysisLog {
  /** Times of this user's analyses at or after `since`, oldest first. */
  abstract since(userId: string, since: Date): Promise<Date[]>;
  abstract record(userId: string, at: Date): Promise<void>;
}
