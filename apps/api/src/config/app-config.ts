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

/** Reading food labels from a photo (F23 piece 3, ADR 0029). */
export interface VisionConfig {
  /** null: label reading is disabled. */
  geminiApiKey: string | null;
  model: string;
}

export interface TracingConfig {
  /** null: tracing is off. */
  langfuse: { publicKey: string; secretKey: string; baseUrl: string } | null;
  environment: string;
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
    readonly tracing: TracingConfig = { langfuse: null, environment: 'local' },
    readonly vision: VisionConfig = { geminiApiKey: null, model: 'gemini-3.5-flash-lite' },
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
      {
        langfuse:
          env.LANGFUSE_PUBLIC_KEY && env.LANGFUSE_SECRET_KEY && env.LANGFUSE_BASE_URL
            ? {
                publicKey: env.LANGFUSE_PUBLIC_KEY,
                secretKey: env.LANGFUSE_SECRET_KEY,
                baseUrl: env.LANGFUSE_BASE_URL.replace(/\/$/, ''),
              }
            : null,
        environment: env.DEPLOY_ENVIRONMENT,
      },
      { geminiApiKey: env.GEMINI_API_KEY ?? null, model: env.LABEL_MODEL },
    );
  }
}
