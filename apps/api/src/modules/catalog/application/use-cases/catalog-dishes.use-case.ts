import type { CatalogDishesResponse } from '@kawsay/contracts/catalog';
import { Injectable } from '@nestjs/common';
import { CatalogSource } from '../ports/catalog-source';

/** Catalog by sync (F23 piece 5): nothing when the phone holds the current version, else the whole list. */
@Injectable()
export class CatalogDishesUseCase {
  constructor(private readonly source: CatalogSource) {}

  execute(version: string | undefined): CatalogDishesResponse {
    const current = this.source.dishes();
    if (version === current.version) return { version: current.version, upToDate: true };
    return current;
  }
}
