import { Injectable } from '@nestjs/common';
import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { EmailTakenError } from '../../domain/errors';
import { assertPasswordAcceptable, normalizeEmail, User } from '../../domain/user';
import { PasswordHasher, UserRepository } from '../ports/auth-ports';

/** Accounts are created from the CLI; the app only signs in (ADR 0018). */
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: { email: string; password: string }): Promise<User> {
    assertPasswordAcceptable(input.password);
    const email = normalizeEmail(input.email);
    if (await this.users.findByEmail(email)) throw new EmailTakenError();

    const user = User.register({
      id: this.ids.uuid(),
      email,
      passwordHash: await this.hasher.hash(input.password),
      now: this.clock.now(),
    });
    await this.users.save(user);
    return user;
  }
}
