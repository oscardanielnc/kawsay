import type { TokenResponse } from '@kawsay/contracts/auth';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateUserUseCase } from '../src/modules/identity/application/use-cases/create-user.use-case';
import { SetPasswordUseCase } from '../src/modules/identity/application/use-cases/set-password.use-case';
import { UserNotFoundError, WeakPasswordError } from '../src/modules/identity/domain/errors';
import { createTestApp } from './setup/create-test-app';

const OLD = 'the-forgotten-password'; // gitleaks:allow (fake test password)
const NEW = 'a-brand-new-password'; // gitleaks:allow (fake test password)

describe('Set a new password from the server CLI (real Postgres)', () => {
  let app: NestExpressApplication;
  const email = `reset-${Date.now()}@kawsay.test`;

  beforeAll(async () => {
    app = await createTestApp();
    await app.get(CreateUserUseCase).execute({ email, password: OLD });
  });

  afterAll(async () => {
    await app.close();
  });

  const login = (password: string) =>
    request(app.getHttpServer()).post('/v1/auth/login').send({ email, password });

  it('the new password signs in, the old one no longer does, and old sessions end', async () => {
    const before = (await login(OLD).expect(200)).body as TokenResponse;
    await app.get(SetPasswordUseCase).execute({ email: email.toUpperCase(), password: NEW });
    await login(NEW).expect(200);
    await login(OLD).expect(401);
    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: before.refreshToken })
      .expect(401);
  });

  it('refuses a short password and an unknown email', async () => {
    await expect(
      app.get(SetPasswordUseCase).execute({ email, password: 'short' }),
    ).rejects.toBeInstanceOf(WeakPasswordError);
    await expect(
      app.get(SetPasswordUseCase).execute({ email: 'nobody@kawsay.test', password: NEW }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
