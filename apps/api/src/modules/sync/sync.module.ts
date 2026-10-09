import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { SyncStore } from './application/ports/sync-store';
import { PullChangesUseCase } from './application/use-cases/pull-changes.use-case';
import { PushChangesUseCase } from './application/use-cases/push-changes.use-case';
import { PrismaSyncStore } from './infrastructure/prisma-sync.store';
import { SyncController } from './presentation/sync.controller';

/** Push/pull of every synced record (ADR 0004, 0018). */
@Module({
  imports: [IdentityModule],
  controllers: [SyncController],
  providers: [
    { provide: SyncStore, useClass: PrismaSyncStore },
    PushChangesUseCase,
    PullChangesUseCase,
  ],
})
export class SyncModule {}
