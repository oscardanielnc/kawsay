import type { AnalysisRequest } from '@kawsay/contracts/insights';
import { describe, expect, it } from 'vitest';
import { AppConfig } from '../../../config/app-config';
import { AiDisabledError, AiUnavailableError } from '../domain/errors';
import { DeepSeekAdapter } from './deepseek.adapter';

const request: AnalysisRequest = {
  period: { from: '2026-09-01', to: '2026-10-12', loggedDays: 24 },
  findings: [],
  week: { green: 4, yellow: 2, red: 1, movementMinutes: 120, lowNutrients: [] },
  notes: [{ date: '2026-10-11', text: 'Creo que me dio diarrea por comer ceviche' }],
};
const valid = { summary: 'Resumen', findings: [], suggestions: [], warningSigns: [] };

const config = (key: string | null) =>
  new AppConfig(
    'test',
    3000,
    'postgres://x',
    {
      accessTokenSecret: 'x'.repeat(32),
      accessTokenTtlSeconds: 900,
      refreshTokenTtlDays: 90,
      loginRateLimitPerMinute: 5,
    },
    { deepseekApiKey: key, model: 'deepseek-flash', dailyLimit: 3 },
  );

/** A fake DeepSeek answering each call with the next content of `answers`. */
function adapterWith(answers: unknown[]) {
  const adapter = new DeepSeekAdapter(config('sk-test-key-of-twenty-chars'));
  const calls: { url: string; init: RequestInit }[] = [];
  adapter.fetchImpl = (url, init) => {
    calls.push({ url: url instanceof Request ? url.url : url.toString(), init: init ?? {} });
    const content = answers.shift();
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const body = { choices: [{ message: { content: text } }] };
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  };
  return { adapter, calls };
}

describe('DeepSeekAdapter (ADR 0007)', () => {
  it('asks deepseek-flash for JSON, with the rules as system prompt and the request (notes included) as user message', async () => {
    const { adapter, calls } = adapterWith([valid]);
    await expect(adapter.analyze(request)).resolves.toEqual(valid);
    const body = JSON.parse(calls[0]!.init.body as string) as {
      model: string;
      response_format: unknown;
      messages: { role: string; content: string }[];
    };
    expect(calls[0]!.url).toBe('https://api.deepseek.com/chat/completions');
    expect(new Headers(calls[0]!.init.headers).get('authorization')).toBe(
      'Bearer sk-test-key-of-twenty-chars',
    );
    expect(body.model).toBe('deepseek-flash');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[0]?.content).toMatch(/nunca diagnosticas/);
    expect(body.messages[1]?.content).toContain('diarrea por comer ceviche');
  });

  it('Invalid AI output is retried once, then a clear error', async () => {
    const twice = adapterWith(['not json', { ...valid, findings: [{ title: 'x' }] }]);
    await expect(twice.adapter.analyze(request)).rejects.toBeInstanceOf(AiUnavailableError);
    expect(twice.calls).toHaveLength(2);

    const once = adapterWith(['not json', valid]);
    await expect(once.adapter.analyze(request)).resolves.toEqual(valid);
  });

  it('without a key the analysis is disabled and nothing leaves the server', async () => {
    const adapter = new DeepSeekAdapter(config(null));
    let called = false;
    adapter.fetchImpl = () => {
      called = true;
      return Promise.reject(new Error('no'));
    };
    await expect(adapter.analyze(request)).rejects.toBeInstanceOf(AiDisabledError);
    expect(called).toBe(false);
  });

  it('a provider error becomes AiUnavailableError', async () => {
    const adapter = new DeepSeekAdapter(config('sk-test-key-of-twenty-chars'));
    adapter.fetchImpl = () => Promise.resolve(new Response('busy', { status: 503 }));
    await expect(adapter.analyze(request)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it('the short summary (ADR 0022) uses its own prompt and contract; a too-long answer is asked again', async () => {
    const short = { summary: 'Corto', findings: [], habits: [], warningSigns: [] };
    const { adapter, calls } = adapterWith([{ ...short, summary: 'x'.repeat(400) }, short]);
    await expect(adapter.summarize(request)).resolves.toEqual(short);
    expect(calls).toHaveLength(2);
    const body = JSON.parse(calls[0]!.init.body as string) as { messages: { content: string }[] };
    expect(body.messages[0]?.content).toMatch(/máx\. 220 caracteres/);
  });

  it('the retry tells the model what broke the contract: habits.0 over 80 characters', async () => {
    const short = { summary: 'Corto', findings: [], habits: [], warningSigns: [] };
    const { adapter, calls } = adapterWith([{ ...short, habits: ['x'.repeat(95)] }, short]);
    await expect(adapter.summarize(request)).resolves.toEqual(short);
    const retry = JSON.parse(calls[1]!.init.body as string) as {
      messages: { role: string; content: string }[];
    };
    expect(retry.messages.map((m) => m.role)).toEqual(['system', 'user', 'assistant', 'user']);
    expect(retry.messages[3]?.content).toMatch(/habits\.0/);
    expect(retry.messages[3]?.content).toMatch(/80/);
  });
});
