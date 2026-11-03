import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { AppConfig } from '../../../config/app-config';
import {
  CatalogSource,
  type FoodList,
  type RemoteCatalog,
} from '../application/ports/catalog-source';

/** Reads packages/catalog/remote/*.json once (copied into the image at CATALOG_DIR). */
@Injectable()
export class FileCatalogSource extends CatalogSource {
  private cached: { dishes: RemoteCatalog; foods: FoodList } | null = null;

  constructor(private readonly config: AppConfig) {
    super();
  }

  private load() {
    if (!this.cached) {
      const read = <T>(file: string) =>
        JSON.parse(readFileSync(join(this.config.catalogDir, file), 'utf8')) as T;
      this.cached = {
        dishes: read<RemoteCatalog>('dishes.json'),
        foods: read<FoodList>('foods.json'),
      };
    }
    return this.cached;
  }

  dishes(): RemoteCatalog {
    return this.load().dishes;
  }

  foods(): FoodList {
    return this.load().foods;
  }
}
