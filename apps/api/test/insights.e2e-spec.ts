import type { TokenResponse } from '@kawsay/contracts/auth';
import type { Analysis, Summary, AnalysisRequest } from '@kawsay/contracts/insights';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateUserUseCase } from '../src/modules/identity/application/use-cases/create-user.use-case';
import { AiPort } from '../src/modules/insights/application/ports/ai-port';
import { createTestApp } from './setup/create-test-app';

const PASSWORD = 'a-long-test-password'; // gitleaks:allow (fake test password)
const body: AnalysisRequest = {
  period: { from: '2026-09-01', to: '2026-10-12', loggedDays: 24 },
  findings: [
    {
      exposure: 'Leche fresca entera',
      effect: 'más hinchazón',
      exposedBad: 6,
      exposedDays: 8,
      baselineBad: 2,
      baselineDays: 16,
      confidence: 'medium',
    },
  ],
  week: { green: 4, yellow: 2, red: 1, movementMinutes: 120, lowNutrients: [] },
  notes: [{ date: '2026-10-11', text: 'Creo que me dio diarrea por comer ceviche' }],
};
const summary: Summary = {
  summary: 'Semana con poco movimiento.',
  findings: [
    { tag: 'food', title: 'Leche y barriga', detail: '6 de 8 días', confidence: 'medium' },
  ],
  habits: ['Camina 10 min después del almuerzo'],
  warningSigns: [],
};
const analysis: Analysis = {
  summary: 'La leche coincide con más hinchazón.',
  findings: [],
  suggestions: [],
  warningSigns: [],
};

async function signIn(app: NestExpressApplication): Promise<string> {
  const email = `ai-${Date.now()}-${Math.random()}@kawsay.test`;
  await app.get(CreateUserUseCase).execute({ email, password: PASSWORD });
  const response = await request(app.getHttpServer())
    .post('/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return (response.body as TokenResponse).accessToken;
}

describe('AI analysis (F17, real Postgres, fake AI)', () => {
  let app: NestExpressApplication;
  let received: AnalysisRequest[] = [];

  beforeAll(async () => {
    app = await createTestApp({
      customize: (builder) =>
        builder.overrideProvider(AiPort).useValue({
          analyze: (r: AnalysisRequest) => {
            received.push(r);
            return Promise.resolve(analysis);
          },
          summarize: (r: AnalysisRequest) => {
            received.push(r);
            return Promise.resolve(summary);
          },
        }),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const analyze = (token: string, payload: unknown = body) =>
    request(app.getHttpServer())
      .post('/v1/insights/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send(payload as object);

  it('needs a signed-in user', async () => {
    await request(app.getHttpServer()).post('/v1/insights/analyze').send(body).expect(401);
  });

  it('returns the analysis and counts down; a 4th within 24 h is 429 with a stable code', async () => {
    received = [];
    const token = await signIn(app);
    const first = await analyze(token).expect(200);
    expect(first.body).toEqual({ analysis, remaining: 2 });
    expect(received[0]?.notes[0]?.text).toContain('ceviche');
    await analyze(token).expect(200);
    await analyze(token).expect(200);
    const fourth = await analyze(token).expect(429);
    expect((fourth.body as { code: string }).code).toBe('insights.limit_reached');
  });

  it('the short summary (ADR 0022) answers on its own endpoint and shares the daily limit', async () => {
    received = [];
    const token = await signIn(app);
    const summarize = () =>
      request(app.getHttpServer())
        .post('/v1/insights/summary')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    expect((await summarize().expect(200)).body).toEqual({ summary, remaining: 2 });
    await analyze(token).expect(200);
    await summarize().expect(200);
    await summarize().expect(429);
  });

  it('refuses a body with extra fields (no identifiers, no intimate entries)', async () => {
    const token = await signIn(app);
    await analyze(token, { ...body, intimate: [{ kind: 'sex' }] }).expect(400);
  });
});

describe('AI analysis without a key', () => {
  it('answers 503 "insights.ai_disabled"', async () => {
    const app = await createTestApp();
    try {
      const token = await signIn(app);
      const response = await request(app.getHttpServer())
        .post('/v1/insights/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(503);
      expect((response.body as { code: string }).code).toBe('insights.ai_disabled');
    } finally {
      await app.close();
    }
  });
});
