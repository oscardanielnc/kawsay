import { AppConfig } from './app-config';
import { envSchema } from './env.schema';

/** Lists every problem at once. Messages name the variable, never its value. */
export class ConfigError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid configuration:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
    this.name = 'ConfigError';
  }
}

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigError(
      parsed.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`),
    );
  }
  return AppConfig.fromEnv(parsed.data);
}
