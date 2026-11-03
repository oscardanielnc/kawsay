import { describe, expect, it } from 'vitest';
import { AppConfig } from '../../../config/app-config';
import type { AiCallRecord } from '../application/ports/ai-call-log';
import { LangfuseTraceSink, MASKED } from './langfuse-trace-sink';

const TEXT = 'almorcé lomo saltado con mi tía';
const call: AiCallRecord = {
  id: '0e7b3c1a-2f4d-4b8e-9c1a-1234567890ab',
  userId: 'u1',
  useCase: 'text-log',
  model: 'deepseek-flash',
  promptVersion: 'text-log.v1',
  tokensIn: 12_000,
  tokensCached: 9_000,
  tokensOut: 200,
  latencyMs: 3_100,
  costUsd: 0.0004,
  outcome: 'ok',
  toolRounds: 2,
  inputText: TEXT,
  proposal: {
    id: 'x',
    entries: [{ catalogId: 'lomo-saltado', name: 'Lomo saltado' }],
    unmatched: [],
  },
  createdAt: new Date('2026-11-03T15:00:00Z'),
};
const config = (keys: boolean) =>
  new AppConfig('production', 3000, 'postgres://x', {} as never, undefined, undefined, {
    langfuse: keys
      ? { publicKey: 'pk', secretKey: 'sk', baseUrl: 'https://cloud.langfuse.com' }
      : null,
    environment: 'prod',
  });

describe('LangfuseTraceSink (ADR 0024)', () => {
  it('a masked span contains no input or output text, only numbers', () => {
    const batch = JSON.stringify(new LangfuseTraceSink(config(true)).otlp(call));
    expect(batch).not.toContain('lomo');
    expect(batch).not.toContain('tía');
    expect(batch).not.toContain('u1');
    expect(batch).toContain(MASKED);
    expect(batch).toContain('{"key":"gen_ai.usage.input_tokens","value":{"intValue":"12000"}}');
    expect(batch).toContain('{"key":"langfuse.environment","value":{"stringValue":"prod"}}');
    expect(batch).toContain('"traceId":"0e7b3c1a2f4d4b8e9c1a1234567890ab"');
  });

  it('posts one OTLP export to the OpenTelemetry endpoint with basic auth; without keys it sends nothing', async () => {
    const sent: { url: string; init?: RequestInit }[] = [];
    const sink = new LangfuseTraceSink(config(true));
    sink.fetchImpl = (url, init) => {
      sent.push({ url: url as string, ...(init && { init }) });
      return Promise.resolve(new Response('{}', { status: 207 }));
    };
    await sink.send(call);
    expect(sent[0]!.url).toBe('https://cloud.langfuse.com/api/public/otel/v1/traces');
    expect((sent[0]!.init?.headers as Record<string, string>).authorization).toMatch(/^Basic /);

    const off = new LangfuseTraceSink(config(false));
    off.fetchImpl = () => Promise.reject(new Error('must not be called'));
    await off.send(call);
  });

  it('a failing tracer never breaks the request', async () => {
    const sink = new LangfuseTraceSink(config(true));
    sink.fetchImpl = () => Promise.reject(new TypeError('fetch failed'));
    await expect(sink.send(call)).resolves.toBeUndefined();
  });
});
