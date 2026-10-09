import type { Change } from '@kawsay/contracts/sync';
import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import type { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { type StoredChange, SyncStore } from '../application/ports/sync-store';

interface Row {
  collection: Change['collection'];
  data: Change['record'];
  seq: bigint;
}

/** `sync_record` in Postgres (ADR 0018). Raw SQL: the upsert-if-newer is one statement for the whole push. */
@Injectable()
export class PrismaSyncStore extends SyncStore {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>) {
    super();
  }

  async lockUser(userId: string): Promise<void> {
    await this.txHost.tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;
  }

  async upsertNewer(userId: string, changes: Change[]): Promise<number> {
    const rows = changes.map(({ collection, record }) => ({
      collection,
      id: record.id,
      data: record,
      updated_at: record.updatedAt,
      deleted_at: record.deletedAt,
    }));
    // The WHERE keeps the stored copy when it is as new or newer: last write wins, retries change nothing.
    return this.txHost.tx.$executeRaw`
      INSERT INTO sync_record (user_id, collection, id, data, updated_at, deleted_at)
      SELECT ${userId}::uuid, r.collection, r.id::uuid, r.data, r.updated_at, r.deleted_at
      FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
        AS r(collection text, id text, data jsonb, updated_at bigint, deleted_at bigint)
      ON CONFLICT (user_id, collection, id) DO UPDATE
        SET data = EXCLUDED.data,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at,
            seq = nextval('sync_record_seq')
        WHERE sync_record.updated_at < EXCLUDED.updated_at`;
  }

  async changesSince(userId: string, since: number, limit: number): Promise<StoredChange[]> {
    const rows = await this.txHost.tx.$queryRaw<Row[]>`
      SELECT collection, data, seq FROM sync_record
      WHERE user_id = ${userId}::uuid AND seq > ${since}
      ORDER BY seq
      LIMIT ${limit}`;
    return rows.map((row) => ({
      collection: row.collection,
      record: row.data,
      seq: Number(row.seq),
    }));
  }
}
