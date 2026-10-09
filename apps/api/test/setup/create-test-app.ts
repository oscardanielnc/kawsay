import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { inject } from 'vitest';
import { AppModule } from '../../src/app.module';
import { loadConfig } from '../../src/config/load-config';
import { configureApp } from '../../src/configure-app';

export interface TestAppOptions {
  /** Override providers, e.g. to fix the clock. */
  customize?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
  env?: NodeJS.ProcessEnv;
}

export const TEST_JWT_SECRET = 'e2e-access-secret-at-least-32-characters-long'; // gitleaks:allow (fake)

/** Boots the real app (same modules as production) against the e2e Postgres. */
export async function createTestApp(options: TestAppOptions = {}): Promise<NestExpressApplication> {
  const config = loadConfig({
    DATABASE_URL: inject('databaseUrl'),
    JWT_ACCESS_SECRET: TEST_JWT_SECRET,
    LOGIN_RATE_LIMIT_PER_MINUTE: '1000',
    ...options.env,
  });
  const customize = options.customize ?? ((builder) => builder);
  const moduleRef = await customize(
    Test.createTestingModule({ imports: [AppModule.register(config)] }),
  ).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: false,
    bodyParser: false,
  });
  configureApp(app);
  await app.init();
  return app;
}
