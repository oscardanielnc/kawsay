import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../app.module';
import { ConfigError, loadConfig } from '../../../../config/load-config';
import { loadEnvFileIfPresent } from '../../../../config/load-env-file';
import { aiStats, type AiStats } from '../../application/ai-stats';
import { AiCallLog } from '../../application/ports/ai-call-log';

const DAY_MS = 24 * 60 * 60 * 1000;

const money = (n: number | null) => (n === null ? '—' : `$${n.toFixed(5)}`);
const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`);
const ms = (n: number | null) => (n === null ? '—' : `${(n / 1000).toFixed(1)} s`);

function line(label: string, s: AiStats): string {
  return [
    label.padEnd(8),
    `calls ${s.calls} (ok ${s.ok})`,
    `cost ${money(s.costUsd)}`,
    `$/entry ${money(s.usdPerEntry)}`,
    `p50 ${ms(s.latencyP50Ms)}`,
    `p95 ${ms(s.latencyP95Ms)}`,
    `accepted as is ${pct(s.acceptance)} of ${s.withFeedback}`,
  ].join(' · ');
}

/**
 * AI numbers of the last 7 and 30 days (ADR 0024), per use case:
 *   docker compose … exec -T api node dist/modules/text-log/presentation/cli/ai-stats.cli.js
 */
async function main(): Promise<void> {
  loadEnvFileIfPresent();
  const app = await NestFactory.createApplicationContext(
    AppModule.register(loadConfig(process.env)),
    {
      logger: ['error'],
    },
  );
  try {
    const log = app.get(AiCallLog);
    const now = Date.now();
    const month = await log.all(new Date(now - 30 * DAY_MS));
    for (const useCase of ['text-log', 'ai-dish'] as const) {
      const rows = month.filter((r) => r.useCase === useCase);
      process.stdout.write(`${useCase}\n`);
      process.stdout.write(
        `${line('7 days', aiStats(rows.filter((r) => r.createdAt.getTime() >= now - 7 * DAY_MS)))}\n`,
      );
      process.stdout.write(`${line('30 days', aiStats(rows))}\n`);
    }
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof ConfigError ? error.message : String(error)}\n`);
  process.exit(1);
});
