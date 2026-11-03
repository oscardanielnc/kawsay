# 0025. Evals: synthetic golden set, exact checks, a gate in CI, model comparison

- Status: Accepted (owner, 2026-10-31)
- Date: 2026-10-31

## Context

A prompt or model change can make text logging worse without anyone noticing. ADR 0013: no real user data in the
repository. The owner's AI budget is about USD 5 a month, his own use included.

## Options considered

- promptfoo (open source; OpenAI announced its acquisition on 2026-03-09): good CLI, but a second way to call the agent
- Langfuse datasets: every run depends on the cloud
- **Own runner that calls the real agent code, a committed baseline, a Python report**: chosen

## Decision

- `evals/` workspace, `golden/text-log.jsonl`: 150 synthetic Spanish phrases with their expected entries, by
  category: simple, several items, portions and units, drinks and sugar, typos and slang, ambiguous (expects a
  question), out of scope, prompt injection
- Exact checks in code, no LLM judge (every check has one right answer): catalog items (precision, recall), meal,
  portion within ±20% in grams, question only when needed, injection ignored
- `pnpm evals` writes `evals/results/<model>-<date>.json`: scores by category, tokens, $ per entry, p50/p95
- **Gate** `.github/workflows/evals.yml`: on pull requests that touch the agent, its prompts or `evals/`, and by
  hand; fails if the score drops more than 2 points or $ per entry rises more than 20% against
  `evals/baseline.json`. The run stops above USD 0.50
- Model comparison, by hand: `deepseek-flash` and two low-cost models with tool calling, picked from the official
  pricing pages when it runs; the numbers and the choice are added here
- `evals/analysis/` in Python (pandas, matplotlib): score by category, cost vs score per model
- The owner's real phrases can be exported from `ai_call` and run locally as a private set; never committed

## Consequences

- CI needs a `DEEPSEEK_API_KEY` secret; the compared models need keys only for the manual run

## Build notes (2026-11-03, A3)

- `pnpm evals`: flash **86.6** ($0.0003/entry), v4-pro 89.0 at 4.5× cost → flash stays; broken prompt → gate 49

