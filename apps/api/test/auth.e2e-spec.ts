import type { TokenResponse } from '@kawsay/contracts/auth';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateUserUseCase } from '../src/modules/identity/application/use-cases/create-user.use-case';
import { Clock } from '../src/shared/application/ports/clock';
import { createTestApp } from './setup/create-test-app';

const PASSWORD = 'a-long-test-password'; // gitleaks:allow (fake test password)

describe('Sign-in with rotating refresh tokens (real Postgres)', () => {
  let app: NestExpressApplication;
  const email = `auth-${Date.now()}@kawsay.test`;

  /** Real time plus a shift the tests move forward. */
  let shiftMs = 0;

  beforeAll(async () => {
    app = await createTestApp({
      customize: (builder) =>
        builder.overrideProvider(Clock).useValue({ now: () => new Date(Date.now() + shiftMs) }),
    });
    await app.get(CreateUserUseCase).execute({ email, password: PASSWORD });
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const login = (password = PASSWORD) =>
    http().post('/v1/auth/login').send({ email: email.toUpperCase(), password });
  const refresh = (refreshToken: string) => http().post('/v1/auth/refresh').send({ refreshToken });

  it('signs in: a 15-minute access token and a refresh token for secure storage', async () => {
    const body = (await login().expect(200)).body as TokenResponse;
    expect(body).toMatchObject({ tokenType: 'Bearer', expiresIn: 900, user: { email } });
    expect(body.refreshToken).toMatch(/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/);
  });

  it('gives the same answer for an unknown email and a wrong password', async () => {
    const unknown = await http()
      .post('/v1/auth/login')
      .send({ email: 'nobody@kawsay.test', password: PASSWORD })
      .expect(401);
    const wrong = await login('wrong-password-123').expect(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(wrong.body).toMatchObject({ code: 'auth.invalid_credentials' });
  });

  it('the access token opens protected routes; no token does not', async () => {
    const { accessToken } = (await login().expect(200)).body as TokenResponse;
    await http().get('/v1/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200);
    const anonymous = await http().get('/v1/auth/me').expect(401);
    expect(anonymous.body).toMatchObject({ code: 'auth.unauthenticated' });
  });

  it('two refreshes at once from the same phone (within 30 s) both get tokens; the session stays open', async () => {
    const first = ((await login().expect(200)).body as TokenResponse).refreshToken;
    const [a, b] = await Promise.all([refresh(first), refresh(first)]);
    expect([a.status, b.status]).toEqual([200, 200]);
    await refresh((b.body as TokenResponse).refreshToken).expect(200);
  });

  it('rotates the refresh token, and revokes the session when an old one is reused after 30 s', async () => {
    const first = ((await login().expect(200)).body as TokenResponse).refreshToken;
    const rotated = (await refresh(first).expect(200)).body as TokenResponse;
    expect(rotated.refreshToken).not.toBe(first);

    shiftMs += 31_000;
    const reuse = await refresh(first).expect(401);
    expect(reuse.body).toMatchObject({ code: 'auth.invalid_session' });
    await refresh(rotated.refreshToken).expect(401);
  });

  it('ends the session on logout', async () => {
    const { refreshToken } = (await login().expect(200)).body as TokenResponse;
    await http().post('/v1/auth/logout').send({ refreshToken }).expect(204);
    await refresh(refreshToken).expect(401);
  });

  it('rejects a body that is not a sign-in', async () => {
    const response = await http().post('/v1/auth/login').send({ email }).expect(400);
    expect(response.body).toMatchObject({ code: 'validation_failed' });
  });
});
