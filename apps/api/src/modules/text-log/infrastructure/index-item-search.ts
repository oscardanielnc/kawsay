import { searchCatalog } from '@kawsay/core/food/search';
import type { CatalogIndex } from '../../catalog/application/ports/catalog-source';
import { ItemSearch, type SearchItem } from '../application/ports/item-search';

/** The published index only, no user dishes: for the evals and tests (synthetic data, no database). */
export class IndexItemSearch extends ItemSearch {
  constructor(private readonly index: CatalogIndex) {
    super();
  }

  search(_userId: string, query: string, kind?: 'food' | 'dish'): Promise<SearchItem[]> {
    const items = kind ? this.index.items.filter((i) => i.kind === kind) : this.index.items;
    return Promise.resolve(searchCatalog(query, items).slice(0, 8));
  }

  get(_userId: string, id: string): Promise<SearchItem | null> {
    return Promise.resolve(this.index.items.find((i) => i.id === id) ?? null);
  }
}
