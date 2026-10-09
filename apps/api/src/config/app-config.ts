import type { Env } from './env.schema';

export interface AuthConfig {
  accessTokenSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  loginRateLimitPerMinute: number;
}

/** Validated configuration, injected by class token. */
export class AppConfig {
  constructor(
    readonly nodeEnv: Env['NODE_ENV'],
    readonly apiPort: number,
    readonly databaseUrl: string,
    readonly auth: AuthConfig,
  ) {}

  static fromEnv(env: Env): AppConfig {
    return new AppConfig(env.NODE_ENV, env.API_PORT, env.DATABASE_URL, {
      accessTokenSecret: env.JWT_ACCESS_SECRET,
      accessTokenTtlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
      loginRateLimitPerMinute: env.LOGIN_RATE_LIMIT_PER_MINUTE,
    });
  }
}
