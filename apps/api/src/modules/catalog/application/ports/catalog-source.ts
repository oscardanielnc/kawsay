import type { CatalogDishesResponse } from '@kawsay/contracts/catalog';

export type RemoteCatalog = Extract<CatalogDishesResponse, { dishes: unknown }>;

/** The foods a recipe may use: catalog ids, names and the first household unit. */
export interface FoodList {
  version: string;
  foods: { id: string; name: string; unit: string | null; generic?: boolean }[];
}

/** Every food and dish the phone can log, for the text agent's tools (ADR 0023). */
export interface CatalogIndex {
  version: string;
  items: {
    kind: 'food' | 'dish';
    id: string;
    name: string;
    source: string;
    generic?: boolean;
    units: { label: string; grams: number }[];
  }[];
}

/** Where the published catalog lives (packages/catalog/remote, shipped with the API image). */
export abstract class CatalogSource {
  abstract dishes(): RemoteCatalog;
  abstract foods(): FoodList;
  abstract index(): CatalogIndex;
}
