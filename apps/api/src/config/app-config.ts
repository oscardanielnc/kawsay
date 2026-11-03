import type { Env } from './env.schema';

export interface AuthConfig {
  accessTokenSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  loginRateLimitPerMinute: number;
}

export interface AiConfig {
  /** null: AI analyses are disabled. */
  deepseekApiKey: string | null;
  model: string;
  dailyLimit: number;
}

/** Validated configuration, injected by class token. */
export class AppConfig {
  constructor(
    readonly nodeEnv: Env['NODE_ENV'],
    readonly apiPort: number,
    readonly databaseUrl: string,
    readonly auth: AuthConfig,
    readonly ai: AiConfig = { deepseekApiKey: null, model: 'deepseek-flash', dailyLimit: 3 },
    /** Folder of the published catalog files (dishes.json, foods.json). */
    readonly catalogDir: string = '../../packages/catalog/remote',
  ) {}

  static fromEnv(env: Env): AppConfig {
    return new AppConfig(
      env.NODE_ENV,
      env.API_PORT,
      env.DATABASE_URL,
      {
        accessTokenSecret: env.JWT_ACCESS_SECRET,
        accessTokenTtlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
        refreshTokenTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
        loginRateLimitPerMinute: env.LOGIN_RATE_LIMIT_PER_MINUTE,
      },
      {
        deepseekApiKey: env.DEEPSEEK_API_KEY ?? null,
        model: env.DEEPSEEK_MODEL,
        dailyLimit: env.AI_DAILY_LIMIT,
      },
      env.CATALOG_DIR,
    );
  }
}
