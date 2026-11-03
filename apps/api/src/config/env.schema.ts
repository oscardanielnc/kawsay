import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: 'must be a postgres:// URL' }),

  /** Signs access tokens (HS256). At least 32 random characters. */
  JWT_ACCESS_SECRET: z.string({ error: 'is required' }).min(32, 'must be at least 32 characters'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  /** The phone stays signed in while it opens the app at least this often. */
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(3650).default(3650),
  LOGIN_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(5),

  /** DeepSeek key for AI analyses (ADR 0007); without it the analysis endpoint answers "AI disabled". */
  DEEPSEEK_API_KEY: z.string().min(20).optional(),
  DEEPSEEK_MODEL: z.string().min(1).default('deepseek-flash'),
  /** AI analyses per user in any 24 h (F17). */
  AI_DAILY_LIMIT: z.coerce.number().int().min(1).max(50).default(3),
  /** The published catalog (packages/catalog/remote): dishes delivered by sync and the AI food list (ADR 0028). */
  /** AI traces in Langfuse Cloud (ADR 0024); all three or tracing stays off. */
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_BASE_URL: z.string().optional(),
  /** dev or prod, carried by every trace. */
  DEPLOY_ENVIRONMENT: z.string().min(1).default('local'),
  CATALOG_DIR: z.string().min(1).default('../../packages/catalog/remote'),
});

export type Env = z.infer<typeof envSchema>;
