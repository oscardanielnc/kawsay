import { type PullResponse, SYNC_PAGE_SIZE } from '@kawsay/contracts/sync';
import { Injectable } from '@nestjs/common';
import { SyncStore } from '../ports/sync-store';

/** Pull (ADR 0004): one page of changes after the client's cursor, in server order. */
@Injectable()
export class PullChangesUseCase {
  constructor(private readonly store: SyncStore) {}

  async execute(userId: string, since: number): Promise<PullResponse> {
    // One extra row says whether another page waits, without counting.
    const rows = await this.store.changesSince(userId, since, SYNC_PAGE_SIZE + 1);
    const page = rows.slice(0, SYNC_PAGE_SIZE);
    return {
      changes: page.map(({ collection, record }) => ({ collection, record })),
      cursor: page.at(-1)?.seq ?? since,
      more: rows.length > SYNC_PAGE_SIZE,
    };
  }
}
