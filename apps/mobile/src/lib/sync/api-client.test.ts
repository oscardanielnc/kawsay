/** @jest-environment node */
import {
  ApiProblemError,
  createApiClient,
  InvalidCredentialsError,
  SignedOutError,
  type TokenStore,
} from './api-client';

const USER = { id: '01926f3a-8b7c-7def-8123-000000000001', email: 'oscar@kawsay.test' };

function memoryTokens(initial: string | null = null): TokenStore & { value: string | null } {
  const store = {
    value: initial,
    read: () => Promise.resolve(store.value),
    write: (token: string) => {
      store.value = token;
      return Promise.resolve();
    },
    clear: () => {
      store.value = null;
      return Promise.resolve();
    },
  };
  return store;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const tokens = (n: number) => ({
  accessToken: `access-${n}`,
  tokenType: 'Bearer',
  expiresIn: 900,
  refreshToken: `refresh-${n}`,
  user: USER,
});

/** A scripted server: answers in order and records what it was asked. */
function scripted(...answers: Response[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetch = jest.fn((url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: url instanceof Request ? url.url : url.toString(), ...(init && { init }) });
    const next = answers.shift();
    return next ? Promise.resolve(next) : Promise.reject(new TypeError('Network request failed'));
  });
  return { fetch: fetch as unknown as typeof globalThis.fetch, calls };
}

describe('API client', () => {
  it('signs in and keeps the refresh token in secure storage', async () => {
    const store = memoryTokens();
    const { fetch } = scripted(json(200, tokens(1)));
    const client = createApiClient({ baseUrl: 'https://api.test/v1', fetch, tokens: store });
    expect(await client.signIn('Oscar@kawsay.test', 'pw')).toEqual({
      userId: USER.id,
      email: USER.email,
    });
    expect(store.value).toBe('refresh-1');
  });

  it('a wrong password says so', async () => {
    const { fetch } = scripted(json(401, { code: 'auth.invalid_credentials' }));
    const client = createApiClient({ baseUrl: 'x', fetch, tokens: memoryTokens() });
    await expect(client.signIn('a@b.c', 'nope')).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('after a restart, refreshes first and then pulls with the new access token', async () => {
    const store = memoryTokens('refresh-0');
    const { fetch, calls } = scripted(
      json(200, tokens(1)),
      json(200, { changes: [], cursor: 0, more: false }),
    );
    const client = createApiClient({ baseUrl: 'https://api.test/v1', fetch, tokens: store });
    await client.sync.pull(0);
    expect(calls.map((c) => c.url)).toEqual([
      'https://api.test/v1/auth/refresh',
      'https://api.test/v1/sync/pull?since=0',
    ]);
    expect(calls[1]?.init?.headers).toMatchObject({ Authorization: 'Bearer access-1' });
    expect(store.value).toBe('refresh-1');
  });

  it('an expired access token is refreshed once and the request retried', async () => {
    const { fetch, calls } = scripted(
      json(200, tokens(1)),
      json(401, {}),
      json(200, tokens(2)),
      json(200, { applied: 0 }),
    );
    const client = createApiClient({ baseUrl: '', fetch, tokens: memoryTokens('refresh-0') });
    expect(await client.sync.push([])).toEqual({ applied: 0 });
    expect(calls.map((c) => c.url)).toEqual([
      '/auth/refresh',
      '/sync/push',
      '/auth/refresh',
      '/sync/push',
    ]);
  });

  it('a revoked session signs the phone out and forgets the token', async () => {
    const store = memoryTokens('refresh-0');
    const { fetch } = scripted(json(401, { code: 'auth.invalid_session' }));
    const client = createApiClient({ baseUrl: '', fetch, tokens: store });
    await expect(client.sync.pull(0)).rejects.toBeInstanceOf(SignedOutError);
    expect(store.value).toBeNull();
  });

  it('signing out forgets the token even without signal', async () => {
    const store = memoryTokens('refresh-0');
    const { fetch } = scripted();
    await createApiClient({ baseUrl: '', fetch, tokens: store }).signOut();
    expect(store.value).toBeNull();
  });

  it('summarize (F17, ADR 0022) posts the request with the access token and returns the summary', async () => {
    const summary = { summary: 'Resumen', findings: [], habits: [], warningSigns: [] };
    const { fetch, calls } = scripted(json(200, tokens(1)), json(200, { summary, remaining: 2 }));
    const client = createApiClient({
      baseUrl: 'https://api.test/v1',
      fetch,
      tokens: memoryTokens('r0'),
    });
    const body = {
      period: { from: '2026-09-01', to: '2026-10-12', loggedDays: 12 },
      findings: [],
      week: { green: 1, yellow: 0, red: 0, movementMinutes: 0, lowNutrients: [] },
      notes: [],
    };
    await expect(client.summarize(body)).resolves.toEqual({ summary, remaining: 2 });
    expect(calls[1]?.url).toBe('https://api.test/v1/insights/summary');
  });

  it('a refused analysis carries its problem code (daily limit)', async () => {
    const { fetch } = scripted(json(200, tokens(1)), json(429, { code: 'insights.limit_reached' }));
    const client = createApiClient({ baseUrl: 'x', fetch, tokens: memoryTokens('r0') });
    const error = await client
      .summarize({
        period: { from: '2026-09-01', to: '2026-10-12', loggedDays: 12 },
        findings: [],
        week: { green: 1, yellow: 0, red: 0, movementMinutes: 0, lowNutrients: [] },
        notes: [],
      })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiProblemError);
    expect(error).toMatchObject({ status: 429, code: 'insights.limit_reached' });
  });

  it('two requests at once after opening the app refresh only once (no "reused token" sign-out)', async () => {
    const store = memoryTokens('refresh-0');
    const { fetch, calls } = scripted(
      json(200, tokens(1)),
      json(200, { changes: [], cursor: 0, more: false }),
      json(200, { changes: [], cursor: 0, more: false }),
    );
    const client = createApiClient({ baseUrl: 'https://api.test/v1', fetch, tokens: store });
    await Promise.all([client.sync.pull(0), client.sync.pull(0)]);
    expect(calls.filter((c) => c.url.endsWith('/auth/refresh'))).toHaveLength(1);
    expect(store.value).toBe('refresh-1');
  });
});
