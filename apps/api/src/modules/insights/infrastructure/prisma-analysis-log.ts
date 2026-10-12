import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { IdGenerator } from '../../../shared/application/ports/id-generator';
import type { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { AnalysisLog } from '../application/ports/analysis-log';

/** `ai_analyses` in Postgres: one row per successful analysis, time only. */
@Injectable()
export class PrismaAnalysisLog extends AnalysisLog {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
    private readonly ids: IdGenerator,
  ) {
    super();
  }

  async since(userId: string, since: Date): Promise<Date[]> {
    const rows = await this.txHost.tx.aiAnalysis.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    return rows.map((r) => r.createdAt);
  }

  async record(userId: string, at: Date): Promise<void> {
    await this.txHost.tx.aiAnalysis.create({
      data: { id: this.ids.uuid(), userId, createdAt: at },
    });
  }
}
