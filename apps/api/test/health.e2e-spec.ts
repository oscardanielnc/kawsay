import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { createTestApp } from './setup/create-test-app';

describe('GET /v1/health', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports the app is up', async () => {
    await request(app.getHttpServer()).get('/v1/health').expect(200, { status: 'ok' });
  });
});
