import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Summary } from '@kawsay/contracts/insights';
import { AppConfig } from '../config/app-config';
import { DeepSeekAdapter } from '../modules/insights/infrastructure/deepseek.adapter';
import { SUMMARY_PROMPT_VERSION } from '../modules/insights/infrastructure/summary-prompt';
import { costUsd } from '../modules/text-log/application/prices';
import { scoreSummary, type SummaryCase, type SummaryScore } from './score-summary';

/**
 * Evals of the short F17 summary (ADR 0025): the real adapter and prompt over evals/golden/summary.jsonl.
 *   pnpm evals:summary [--model deepseek-flash] [--gate]
 * Writes evals/results/summary-<model>-<date>.json; with --gate, fails below evals/summary-baseline.json.
 */
const ROOT = resolve(__dirname, '../../../..');
const BUDGET_USD = 0.2;

async function main(): Promise<void> {
  const i = process.argv.indexOf('--model');
  const model = i === -1 ? 'deepseek-flash' : process.argv[i + 1]!;
  const config = new AppConfig(
    'test',
    0,
    '',
    {
      accessTokenSecret: '',
      accessTokenTtlSeconds: 0,
      refreshTokenTtlDays: 0,
      loginRateLimitPerMinute: 0,
    },
    { deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? null, model, dailyLimit: 0 },
  );
  let spent = 0;
  /** A fresh adapter per case, so the raw answers of that case can be kept when they fail the contract. */
  const adapterFor = (raw: string[]) => {
    const adapter = new DeepSeekAdapter(config);
    // Every call's usage is priced as it comes back; the run stops at the budget.
    adapter.fetchImpl = async (input, init) => {
      const response = await fetch(input, init);
      const body = (await response.clone().json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: {
          prompt_tokens: number;
          prompt_cache_hit_tokens?: number;
          completion_tokens: number;
        };
      };
      raw.push(body.choices?.[0]?.message?.content ?? '');
      if (body.usage)
        spent += costUsd(
          model,
          {
            tokensIn: body.usage.prompt_tokens,
            tokensCached: body.usage.prompt_cache_hit_tokens ?? 0,
            tokensOut: body.usage.completion_tokens,
          },
          new Date(),
        );
      return response;
    };
    return adapter;
  };

  const golden = readFileSync(join(ROOT, 'evals/golden/summary.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as SummaryCase);
  const results: (SummaryScore & {
    output: Summary | null;
    latencyMs: number;
    /** Why each attempt failed the contract, when it did. */
    invalid?: string[];
  })[] = [];
  await Promise.all(
    [0, 1, 2, 3].map(async (worker) => {
      for (let n = worker; n < golden.length && spent < BUDGET_USD; n += 4) {
        const c = golden[n]!;
        const started = Date.now();
        const raw: string[] = [];
        const output: Summary | null = await adapterFor(raw)
          .summarize(c.request)
          .catch(() => null);
        const invalid = output ? undefined : raw.map(contractIssues);
        results.push({
          ...scoreSummary(c, output),
          output,
          latencyMs: Date.now() - started,
          ...(invalid && { invalid }),
        });
        process.stdout.write(`\r${results.length}/${golden.length}`);
      }
    }),
  );

  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const byCategory: Record<string, number> = {};
  for (const category of new Set(results.map((r) => r.category)))
    byCategory[category] =
      Math.round(mean(results.filter((r) => r.category === category).map((r) => r.score)) * 1000) /
      10;
  const checks: Record<string, number> = {};
  // Valid answers are a rate over every case; the other checks only over valid answers, so they do not double count.
  const valid = results.filter((r) => r.output);
  checks.valid = Math.round(mean(results.map((r) => r.checks.valid ?? 0)) * 1000) / 10;
  for (const key of ['grounded', 'numbers', 'warning'])
    checks[key] = Math.round(mean(valid.map((r) => r.checks[key] ?? 0)) * 1000) / 10;
  const report = {
    model,
    promptVersion: SUMMARY_PROMPT_VERSION,
    date: new Date().toISOString(),
    cases: results.length,
    score: Math.round(mean(results.map((r) => r.score)) * 1000) / 10,
    checks,
    byCategory,
    costUsd: spent,
    results: results.sort((a, b) => a.id.localeCompare(b.id)),
  };
  mkdirSync(join(ROOT, 'evals/results'), { recursive: true });
  const file = join(
    ROOT,
    `evals/results/summary-${model}-${SUMMARY_PROMPT_VERSION}-${report.date.slice(0, 10)}.json`,
  );
  writeFileSync(file, `${JSON.stringify(report, null, 1)}\n`);
  const table = [
    `| ${model} ${SUMMARY_PROMPT_VERSION} | score ${report.score} | $ ${spent.toFixed(4)} |`,
    ...Object.entries({ ...checks, ...byCategory }).map(([k, v]) => `| ${k} | ${v} |`),
  ].join('\n');
  process.stdout.write(`\n${table}\n→ ${file}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, `### Summary evals\n\n${table}\n`, {
      flag: 'a',
    });

  if (process.argv.includes('--gate')) {
    const baseline = JSON.parse(
      readFileSync(join(ROOT, 'evals/summary-baseline.json'), 'utf8'),
    ) as { score: number };
    const pass = report.score >= baseline.score - 5;
    process.stdout.write(
      pass
        ? `gate: pass (baseline ${baseline.score})\n`
        : `gate: FAIL (baseline ${baseline.score})\n`,
    );
    if (!pass) process.exit(1);
  }
}

/** The contract's complaints about one raw answer: paths and messages, never the text. */
function contractIssues(content: string): string {
  try {
    const parsed = Summary.safeParse(JSON.parse(content));
    return parsed.success
      ? 'ok'
      : parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  } catch {
    return 'not JSON';
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
