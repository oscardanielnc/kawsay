/** A food or dish the phone can log, as the agent's tools see it. */
export interface SearchItem {
  kind: 'food' | 'dish';
  id: string;
  name: string;
  /** Household units with grams; a dish has its serving. */
  units: { label: string; grams: number }[];
}

/**
 * Read-only catalog access for the agent (ADR 0023): curated, INS group S and estimated dishes, catalog foods and
 * the user's own synced dishes. Never the journal.
 */
export abstract class ItemSearch {
  abstract search(userId: string, query: string, kind?: 'food' | 'dish'): Promise<SearchItem[]>;
  abstract get(userId: string, id: string): Promise<SearchItem | null>;
}
