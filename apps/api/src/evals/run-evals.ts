import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { CatalogIndex } from '../modules/catalog/application/ports/catalog-source';
import type { AgentModel, ModelUsage } from '../modules/text-log/application/ports/agent-model';
import { costUsd, PRICES } from '../modules/text-log/application/prices';
import { TextLogAgent } from '../modules/text-log/application/text-log-agent';
import { TEXT_LOG_PROMPT_VERSION } from '../modules/text-log/application/text-log-prompt';
import { ChatToolsModel } from '../modules/text-log/infrastructure/deepseek-agent-model';
import { IndexItemSearch } from '../modules/text-log/infrastructure/index-item-search';
import {
  gate,
  scoreCase,
  summarize,
  type CaseScore,
  type GoldenCase,
  type Proposal,
} from './score';

/**
 * The eval runner (ADR 0025): the real agent and adapter over the synthetic golden set.
 *   pnpm evals [--model deepseek-flash|deepseek-v4-pro|gemini-…] [--gate] [--limit N]
 * Writes evals/results/<model>-<date>.json; with --gate, compares with evals/baseline.json and fails on a regression.
 */
const ROOT = resolve(__dirname, '../../../..');
const BUDGET_USD = 0.5;
const CONCURRENCY = Number(process.argv[process.argv.indexOf('--concurrency') + 1]) || 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Gemini's OpenAI-compatible endpoint, priced per 1M tokens (in cached · in · out) checked the day it runs. */
const GEMINI_PRICES: Record<string, { cached: number; in: number; out: number }> = {
  'gemini-3.1-flash-lite': { cached: 0.025, in: 0.1, out: 0.4 },
  'gemini-3.5-flash-lite': { cached: 0.025, in: 0.1, out: 0.4 },
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function modelFor(name: string): AgentModel {
  if (name.startsWith('gemini')) {
    return new ChatToolsModel({
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      apiKey: process.env.GEMINI_API_KEY ?? null,
      model: name,
      extra: { reasoning_effort: 'low' },
    });
  }
  return new ChatToolsModel({
    endpoint: 'https://api.deepseek.com/chat/completions',
    apiKey: process.env.DEEPSEEK_API_KEY ?? null,
    model: name,
    extra: { reasoning_effort: 'low' },
  });
}

function priceOf(model: string, usage: ModelUsage, at: Date): number {
  const gemini = GEMINI_PRICES[model];
  if (!gemini) return costUsd(model, usage, at);
  const fresh = usage.tokensIn - usage.tokensCached;
  return (
    (usage.tokensCached * gemini.cached + fresh * gemini.in + usage.tokensOut * gemini.out) / 1e6
  );
}

const percentile = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]! : 0;
};

async function main(): Promise<void> {
  const model = arg('model') ?? 'deepseek-flash';
  const limit = Number(arg('limit') ?? Infinity);
  const index = JSON.parse(
    readFileSync(join(ROOT, 'packages/catalog/remote/index.json'), 'utf8'),
  ) as CatalogIndex;
  const golden = readFileSync(join(ROOT, 'evals/golden/text-log.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as GoldenCase)
    .slice(0, limit);
  const agent = new TextLogAgent(modelFor(model), new IndexItemSearch(index));

  let spent = 0;
  let stopped = false;
  const results: (CaseScore & {
    latencyMs: number;
    costUsd: number;
    usage: ModelUsage | null;
    proposal: Proposal | null;
    error?: string;
  })[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < golden.length && !stopped) {
        const g = golden[next++]!;
        const started = Date.now();
        let proposal: Proposal | null = null;
        let usage: ModelUsage | null = null;
        let error: string | undefined;
        // A provider's rate limit (free tiers) is waited out, up to 4 tries.
        for (let attempt = 0; attempt < 4; attempt++) {
          error = undefined;
          try {
            const out = await agent.run('evals', {
              text: g.text,
              localDate: '2026-11-03',
              timeBand: g.timeBand,
            });
            usage = out.usage;
            if (out.outcome === 'ok') proposal = out.proposal;
            else error = 'invalid';
          } catch (e) {
            error = e instanceof Error ? e.message : 'unknown';
          }
          if (!error || !/HTTP (429|503)|Timeout/.test(error)) break;
          await sleep(20_000 * (attempt + 1));
        }
        const cost = usage ? priceOf(model, usage, new Date(started)) : 0;
        spent += cost;
        if (spent > BUDGET_USD) stopped = true;
        results.push({
          ...scoreCase(g, proposal, index.items),
          latencyMs: Date.now() - started,
          costUsd: cost,
          usage,
          proposal,
          ...(error && { error }),
        });
        process.stdout.write(`\r${results.length}/${golden.length}`);
      }
    }),
  );

  const { score, byCategory } = summarize(results);
  const entries = results.reduce((n, r) => n + (r.proposal?.entries.length ?? 0), 0);
  const report = {
    model,
    promptVersion: TEXT_LOG_PROMPT_VERSION,
    date: new Date().toISOString(),
    cases: results.length,
    stoppedAtBudget: stopped,
    score: Math.round(score * 10) / 10,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, Math.round(v * 10) / 10]),
    ),
    costUsd: spent,
    usdPerEntry: entries ? spent / entries : 0,
    latencyP50Ms: percentile(
      results.map((r) => r.latencyMs),
      0.5,
    ),
    latencyP95Ms: percentile(
      results.map((r) => r.latencyMs),
      0.95,
    ),
    errors: results.filter((r) => r.error).length,
    prices: PRICES[model] ?? GEMINI_PRICES[model] ?? null,
    results: results.sort((a, b) => a.id.localeCompare(b.id)),
  };
  mkdirSync(join(ROOT, 'evals/results'), { recursive: true });
  const file = join(ROOT, `evals/results/${model}-${report.date.slice(0, 10)}.json`);
  writeFileSync(file, `${JSON.stringify(report, null, 1)}\n`);
  const table = [
    `| ${model} | score ${report.score} | $ ${spent.toFixed(4)} | $/entry ${report.usdPerEntry.toFixed(6)} | p50 ${(report.latencyP50Ms / 1000).toFixed(1)} s | p95 ${(report.latencyP95Ms / 1000).toFixed(1)} s | errors ${report.errors} |`,
    ...Object.entries(report.byCategory).map(([k, v]) => `| ${k} | ${v} |`),
  ].join('\n');
  process.stdout.write(`\n${table}\n→ ${file}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, `### Evals\n\n${table}\n`, { flag: 'a' });

  if (process.argv.includes('--gate')) {
    const baseline = JSON.parse(readFileSync(join(ROOT, 'evals/baseline.json'), 'utf8')) as {
      score: number;
      usdPerEntry: number;
    };
    const verdict = gate(baseline, report);
    process.stdout.write(
      verdict.pass
        ? `gate: pass (baseline ${baseline.score})\n`
        : `gate: FAIL — ${verdict.reasons.join('; ')}\n`,
    );
    if (!verdict.pass) process.exit(1);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
