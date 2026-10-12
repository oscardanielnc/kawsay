import { Injectable } from '@nestjs/common';
import { Clock } from '../../../../shared/application/ports/clock';
import { TransactionRunner } from '../../../../shared/application/ports/transaction-runner';
import { UserNotFoundError } from '../../domain/errors';
import { assertPasswordAcceptable, normalizeEmail } from '../../domain/user';
import { PasswordHasher, SessionRepository, UserRepository } from '../ports/auth-ports';

/** A new password from the server CLI (no reset by email yet): every open session ends with the old one. */
@Injectable()
export class SetPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
    private readonly transactions: TransactionRunner,
  ) {}

  async execute(input: { email: string; password: string }): Promise<void> {
    assertPasswordAcceptable(input.password);
    const user = await this.users.findByEmail(normalizeEmail(input.email));
    if (!user) throw new UserNotFoundError();
    const passwordHash = await this.hasher.hash(input.password);
    await this.transactions.run(async () => {
      await this.users.save(user.withPasswordHash(passwordHash));
      await this.sessions.revokeAllSessions(user.id, 'password-changed', this.clock.now());
    });
  }
}
