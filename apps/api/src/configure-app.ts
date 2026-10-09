import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

/**
 * HTTP setup shared by `main.ts` and the e2e tests, so tests run the same pipeline as production. The app must be
 * created with `bodyParser: false`, so the larger JSON limit below is the only parser.
 */
export function configureApp(app: NestExpressApplication): void {
  app.setGlobalPrefix('v1');
  app.use(helmet());
  // A full first sync sends up to 500 records per request.
  app.useBodyParser('json', { limit: '2mb' });
  // Behind Cloudflare Tunnel: the client IP (for rate limits) comes from the proxy header.
  app.set('trust proxy', 1);
}
