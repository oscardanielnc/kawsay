import { TokenResponse } from '@kawsay/contracts/auth';
import { type Change, PullResponse, PushResponse } from '@kawsay/contracts/sync';
import type { SyncApi } from './engine';

/** Where the refresh token lives: the phone's secure storage (ADR 0005); memory in tests. */
export interface TokenStore {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
}

/** Wrong email or password. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

/** The session ended on the server (expired, revoked or signed out elsewhere): sign in again. */
export class SignedOutError extends Error {
  constructor() {
    super('Signed out');
    this.name = 'SignedOutError';
  }
}

export interface ApiClient {
  signIn(email: string, password: string): Promise<{ userId: string; email: string }>;
  signOut(): Promise<void>;
  sync: SyncApi;
}

/**
 * The API over HTTPS. The access token stays in memory; when it is missing or expired, the refresh token from
 * secure storage gets a new pair (rotation, ADR 0005). Network failures surface as the `fetch` error.
 */
export function createApiClient({
  baseUrl,
  fetch,
  tokens,
}: {
  baseUrl: string;
  fetch: typeof globalThis.fetch;
  tokens: TokenStore;
}): ApiClient {
  let accessToken: string | null = null;

  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });

  async function keep(response: Response): Promise<TokenResponse> {
    const issued = TokenResponse.parse(await response.json());
    await tokens.write(issued.refreshToken);
    accessToken = issued.accessToken;
    return issued;
  }

  async function refresh(): Promise<void> {
    const refreshToken = await tokens.read();
    if (!refreshToken) throw new SignedOutError();
    const response = await post('/auth/refresh', { refreshToken });
    if (response.status === 401) {
      await tokens.clear();
      throw new SignedOutError();
    }
    if (!response.ok) throw new Error(`Refresh failed: ${response.status}`);
    await keep(response);
  }

  /** A signed request; one refresh and retry when the access token is missing or expired. */
  async function authed(path: string, init: RequestInit = {}): Promise<unknown> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (!accessToken) await refresh();
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken ?? ''}`,
        },
      });
      if (response.status === 401) {
        accessToken = null;
        continue;
      }
      if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
      return response.json();
    }
    throw new SignedOutError();
  }

  return {
    async signIn(email, password) {
      const response = await post('/auth/login', { email, password });
      if (response.status === 401) throw new InvalidCredentialsError();
      if (!response.ok) throw new Error(`Sign-in failed: ${response.status}`);
      const { user } = await keep(response);
      return { userId: user.id, email: user.email };
    },

    async signOut() {
      const refreshToken = await tokens.read();
      accessToken = null;
      await tokens.clear();
      // Best effort: the session also expires on its own if the phone is offline now.
      if (refreshToken) await post('/auth/logout', { refreshToken }).catch(() => undefined);
    },

    sync: {
      push: async (changes: Change[]) =>
        PushResponse.parse(
          await authed('/sync/push', { method: 'POST', body: JSON.stringify({ changes }) }),
        ),
      pull: async (since: number) => PullResponse.parse(await authed(`/sync/pull?since=${since}`)),
    },
  };
}
