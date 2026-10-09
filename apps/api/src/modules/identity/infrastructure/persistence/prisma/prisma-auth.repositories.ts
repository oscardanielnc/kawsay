import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import type { User as UserRow } from '../../../../../generated/prisma/client';
import type { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { SessionRepository, UserRepository } from '../../../application/ports/auth-ports';
import type { RefreshTokenRecord, SessionRecord } from '../../../domain/refresh-token';
import { User } from '../../../domain/user';

const toUser = (row: UserRow): User => User.restore({ ...row });

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>) {
    super();
  }

  private get tx() {
    return this.txHost.tx;
  }

  async save(user: User): Promise<void> {
    await this.tx.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
      },
      update: { passwordHash: user.passwordHash },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.tx.user.findUnique({ where: { email } });
    return row ? toUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.tx.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }
}

@Injectable()
export class PrismaSessionRepository extends SessionRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>) {
    super();
  }

  private get tx() {
    return this.txHost.tx;
  }

  async createSession(session: SessionRecord): Promise<void> {
    await this.tx.session.create({ data: session });
  }

  async findSession(id: string): Promise<SessionRecord | null> {
    return this.tx.session.findUnique({
      where: { id },
      select: { id: true, userId: true, createdAt: true, revokedAt: true },
    });
  }

  async revokeSession(id: string, reason: string, at: Date): Promise<void> {
    await this.tx.session.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: at, revokedReason: reason },
    });
  }

  async saveRefreshToken(token: RefreshTokenRecord): Promise<void> {
    await this.tx.refreshToken.create({ data: token });
  }

  async findRefreshToken(id: string): Promise<RefreshTokenRecord | null> {
    return this.tx.refreshToken.findUnique({ where: { id } });
  }

  async markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
    // The WHERE makes this a compare-and-set: of two concurrent uses, exactly one wins.
    const { count } = await this.tx.refreshToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: at },
    });
    return count === 1;
  }
}
