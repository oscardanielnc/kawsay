import type { Change, PushResponse } from '@kawsay/contracts/sync';
import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '../../../../shared/application/ports/transaction-runner';
import { SyncStore } from '../ports/sync-store';

/** Keeps the newest copy of each record when a push carries the same record twice. */
export function newestPerRecord(changes: Change[]): Change[] {
  const newest = new Map<string, Change>();
  for (const change of changes) {
    const key = `${change.collection}:${change.record.id}`;
    const seen = newest.get(key);
    if (!seen || seen.record.updatedAt < change.record.updatedAt) newest.set(key, change);
  }
  return [...newest.values()];
}

/** Push (ADR 0004): the newest edit of each record wins; a retried push stores nothing twice. */
@Injectable()
export class PushChangesUseCase {
  constructor(
    private readonly store: SyncStore,
    private readonly transaction: TransactionRunner,
  ) {}

  async execute(userId: string, changes: Change[]): Promise<PushResponse> {
    if (changes.length === 0) return { applied: 0 };
    const applied = await this.transaction.run(async () => {
      await this.store.lockUser(userId);
      return this.store.upsertNewer(userId, newestPerRecord(changes));
    });
    return { applied };
  }
}
