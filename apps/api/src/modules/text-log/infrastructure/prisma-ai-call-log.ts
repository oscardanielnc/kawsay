import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import type { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { AiCallLog, type AiCallRecord } from '../application/ports/ai-call-log';

/** `ai_call` in Postgres (ADR 0024). */
@Injectable()
export class PrismaAiCallLog extends AiCallLog {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>) {
    super();
  }

  async record(call: AiCallRecord): Promise<void> {
    await this.txHost.tx.aiCall.create({
      data: {
        ...call,
        proposal: call.proposal === null ? undefined : (call.proposal as object),
      },
    });
  }

  async since(userId: string, useCase: AiCallRecord['useCase'], since: Date) {
    const rows = await this.txHost.tx.aiCall.findMany({
      where: { userId, useCase, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, costUsd: true },
    });
    return {
      count: rows.length,
      costUsd: rows.reduce((sum, r) => sum + r.costUsd, 0),
      oldest: rows[0]?.createdAt ?? null,
    };
  }

  async feedback(userId: string, id: string, feedback: unknown): Promise<boolean> {
    const { count } = await this.txHost.tx.aiCall.updateMany({
      where: { id, userId },
      data: { feedback: feedback as object },
    });
    return count === 1;
  }
}
