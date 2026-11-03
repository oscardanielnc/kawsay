import { searchCatalog } from '@kawsay/core/food/search';
import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import type { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CatalogSource } from '../../catalog/application/ports/catalog-source';
import { ItemSearch, type SearchItem } from '../application/ports/item-search';

const RESULTS = 8;

/**
 * The published catalog index plus the user's own synced dishes (`user_dish` records), searched with the phone's
 * rules (`@kawsay/core/food/search`). Read-only; the journal is never read (ADR 0023).
 */
@Injectable()
export class CatalogItemSearch extends ItemSearch {
  constructor(
    private readonly catalog: CatalogSource,
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {
    super();
  }

  private async userDishes(userId: string) {
    const rows = await this.txHost.tx.syncRecord.findMany({
      where: { userId, collection: 'user_dish', deletedAt: null },
      select: { id: true, data: true },
    });
    return rows.map((r) => ({
      kind: 'dish' as const,
      id: r.id,
      name: nameOf(r.data),
      source: 'user',
      units: [] as { label: string; grams: number }[],
    }));
  }

  async search(userId: string, query: string, kind?: 'food' | 'dish'): Promise<SearchItem[]> {
    const items = [...(await this.userDishes(userId)), ...this.catalog.index().items];
    return searchCatalog(query, kind ? items.filter((i) => i.kind === kind) : items)
      .slice(0, RESULTS)
      .map(({ kind: k, id, name, units }) => ({ kind: k, id, name, units }));
  }

  async get(userId: string, id: string): Promise<SearchItem | null> {
    const found =
      this.catalog.index().items.find((i) => i.id === id) ??
      (await this.userDishes(userId)).find((i) => i.id === id);
    return found ? { kind: found.kind, id: found.id, name: found.name, units: found.units } : null;
  }
}

const nameOf = (data: unknown): string => {
  const name = (data as { name?: unknown } | null)?.name;
  return typeof name === 'string' ? name : '';
};
