# A3. Evals and the CI gate

Goal: a change that makes text logging worse fails CI (ADR 0025).

## Steps

1. **Golden set** `evals/golden/text-log.jsonl`, 150 synthetic phrases: simple 40 · several items 30 · portions and
   units 25 · drinks and sugar 15 · typos and slang 15 · ambiguous 10 (expect a question) · out of scope 5 ·
   injection and prompt leak 10. A test checks that every expected id exists in the catalog
2. **Runner** (`pnpm evals`): the real agent and adapter, concurrency 4, stops above USD 0.50, writes
   `evals/results/<model>-<date>.json`
3. **Scores:** item precision and recall, meal, portion within ±20% in grams, question when needed, injection ignored;
   $ per entry; p50/p95
4. **Baseline** `evals/baseline.json` from the first full run with `deepseek-flash`
5. **Gate** `.github/workflows/evals.yml`: pull requests that touch the agent, prompts or `evals/`, plus manual
   dispatch; a summary table in the run; fails on −2 points or +20% $ per entry. The secret is already set
6. **Comparison** (manual run): `deepseek-v4-pro` (same key) and a Gemini Flash-Lite through Gemini's
   OpenAI-compatible endpoint (`GEMINI_API_KEY`, free tier: it may use the content, so synthetic data only). Check
   names and prices on the official pages the day it runs
7. **Python report** `evals/analysis/`: score by category and cost vs score per model, as PNG + `report.md`. If Python
   is missing, give Oscar one install command
8. Add the numbers and the model choice to ADR 0025

## Done when

- [ ] Baseline committed; a deliberately broken prompt makes the gate fail on a throwaway branch pushed to `origin`
      (pre-approved), then the branch is deleted
