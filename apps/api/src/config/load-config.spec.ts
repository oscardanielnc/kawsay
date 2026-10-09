import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from './load-config';

const valid = {
  DATABASE_URL: 'postgresql://kawsay:kawsay@localhost:5433/kawsay',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
};

describe('loadConfig', () => {
  it('fills defaults: 15-minute access tokens, 90-day refresh tokens, port 3000', () => {
    const config = loadConfig(valid);
    expect(config.auth).toMatchObject({ accessTokenTtlSeconds: 900, refreshTokenTtlDays: 90 });
    expect(config.apiPort).toBe(3000);
  });

  it('lists every problem by variable name, never by value', () => {
    let error: unknown;
    try {
      loadConfig({ DATABASE_URL: 'mysql://secret-host', JWT_ACCESS_SECRET: 'short' });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ConfigError);
    const message = (error as ConfigError).message;
    expect(message).toContain('DATABASE_URL');
    expect(message).toContain('JWT_ACCESS_SECRET');
    expect(message).not.toContain('secret-host');
  });
});
