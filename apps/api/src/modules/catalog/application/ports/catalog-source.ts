import type { CatalogDishesResponse } from '@kawsay/contracts/catalog';

export type RemoteCatalog = Extract<CatalogDishesResponse, { dishes: unknown }>;

/** The foods a recipe may use: catalog ids, names and the first household unit. */
export interface FoodList {
  version: string;
  foods: { id: string; name: string; unit: string | null; generic?: boolean }[];
}

/** Where the published catalog lives (packages/catalog/remote, shipped with the API image). */
export abstract class CatalogSource {
  abstract dishes(): RemoteCatalog;
  abstract foods(): FoodList;
}
