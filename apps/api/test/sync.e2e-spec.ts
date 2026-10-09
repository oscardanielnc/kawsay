import type { TokenResponse } from '@kawsay/contracts/auth';
import type { PullResponse, PushResponse } from '@kawsay/contracts/sync';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateUserUseCase } from '../src/modules/identity/application/use-cases/create-user.use-case';
import { createTestApp } from './setup/create-test-app';

const PASSWORD = 'a-long-test-password'; // gitleaks:allow (fake test password)
let counter = 0;
/** A valid UUIDv7-shaped id, unique per call. */
const newId = () => `01926f3a-8b7c-7def-8123-${String(++counter).padStart(12, '0')}`;

const weight = (overrides: Record<string, unknown> = {}) => ({
  id: newId(),
  updatedAt: 1_000,
  deletedAt: null,
  date: '2026-10-09',
  loggedAt: 1_000,
  timeZone: 'America/Lima',
  kg: 80.2,
  ...overrides,
});

describe('Sync push/pull (real Postgres)', () => {
  let app: NestExpressApplication;
  const tokens: Record<'oscar' | 'other', string> = { oscar: '', other: '' };

  beforeAll(async () => {
    app = await createTestApp();
    for (const name of ['oscar', 'other'] as const) {
      const email = `${name}-${Date.now()}@kawsay.test`;
      await app.get(CreateUserUseCase).execute({ email, password: PASSWORD });
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);
      tokens[name] = (response.body as TokenResponse).accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  const push = (records: Record<string, unknown>[], who: 'oscar' | 'other' = 'oscar') =>
    request(app.getHttpServer())
      .post('/v1/sync/push')
      .set('Authorization', `Bearer ${tokens[who]}`)
      .send({ changes: records.map((record) => ({ collection: 'weight_entry', record })) });
  const pull = async (since: number, who: 'oscar' | 'other' = 'oscar') =>
    (
      await request(app.getHttpServer())
        .get(`/v1/sync/pull?since=${since}`)
        .set('Authorization', `Bearer ${tokens[who]}`)
        .expect(200)
    ).body as PullResponse;

  it('entries made in airplane mode appear on the server after reconnecting, without duplicates', async () => {
    const start = (await pull(0)).cursor;
    const offline = [weight(), weight({ date: '2026-10-10' })];

    expect(((await push(offline).expect(200)).body as PushResponse).applied).toBe(2);
    // The phone lost the response and retries the same push.
    expect(((await push(offline).expect(200)).body as PushResponse).applied).toBe(0);

    const page = await pull(start);
    expect(page.changes.map((c) => c.record)).toEqual(offline);
    expect(page.more).toBe(false);
    expect((await pull(page.cursor)).changes).toEqual([]);
  });

  it('editing the same entry on two devices keeps the most recent edit', async () => {
    const original = weight({ updatedAt: 1_000 });
    await push([original]).expect(200);
    const start = (await pull(0)).cursor;

    await push([{ ...original, kg: 79.9, updatedAt: 3_000 }]).expect(200); // phone A, later
    await push([{ ...original, kg: 81.0, updatedAt: 2_000 }]).expect(200); // phone B, earlier, synced last

    const changes = (await pull(start)).changes;
    expect(changes).toHaveLength(1);
    expect(changes[0]?.record).toMatchObject({ kg: 79.9, updatedAt: 3_000 });
  });

  it('a delete travels as a tombstone', async () => {
    const entry = weight();
    await push([entry]).expect(200);
    const start = (await pull(0)).cursor;
    await push([{ ...entry, deletedAt: 5_000, updatedAt: 5_000 }]).expect(200);
    expect((await pull(start)).changes[0]?.record).toMatchObject({ deletedAt: 5_000 });
  });

  it("one account never sees another's records", async () => {
    await push([weight({ kg: 99 })], 'other').expect(200);
    const mine = (await pull(0)).changes.map((c) => c.record);
    expect(mine).not.toContainEqual(expect.objectContaining({ kg: 99 }));
  });

  it('pages a long history: 500 per pull, then more', async () => {
    const start = (await pull(0)).cursor;
    const many = Array.from({ length: 600 }, (_, i) => weight({ kg: 60 + i / 100 }));
    await push(many.slice(0, 300)).expect(200);
    await push(many.slice(300)).expect(200);

    const first = await pull(start);
    expect(first.changes).toHaveLength(500);
    expect(first.more).toBe(true);
    const second = await pull(first.cursor);
    expect(second.changes).toHaveLength(100);
    expect(second.more).toBe(false);
  });

  it('rejects a record that does not match its collection, naming the field', async () => {
    const response = await push([weight({ kg: 'heavy' })]).expect(400);
    expect(response.body).toMatchObject({
      code: 'validation_failed',
      errors: [{ field: 'changes.0.record.kg' }],
    });
  });

  it('needs a signed-in user', async () => {
    await request(app.getHttpServer()).get('/v1/sync/pull').expect(401);
    await request(app.getHttpServer()).post('/v1/sync/push').send({ changes: [] }).expect(401);
  });
});
