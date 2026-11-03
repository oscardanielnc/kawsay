# A text logging agent that cannot invent a calorie

*Kawsay, November 2026. Every example and number here comes from synthetic data.*

## Problem

Logging a meal took several taps: open a meal, search, pick, set a portion. People write "almorcé chaufa e Inca
Kola" much faster. A single prompt that returns food names is not enough: it has no idea what the catalog holds, and
a model asked for nutrients will make them up.

## Design

**The AI picks, the table computes.** The agent may only choose catalog ids and portions. The phone turns them into
nutrients from the Peruvian INS 2023 tables, the same way as a manual entry.

- **A small tool loop, no framework.** The API sends an OpenAI-compatible chat with three tools: `search_catalog` and
  `get_units` (read-only, over the 3,000+ foods and dishes the phone can log) and `propose_entries` (the final
  answer). At most 4 rounds and 1 retry on invalid output. The loop lives in the application layer behind an
  `AgentModel` port, so tests drive it with a scripted fake model and evals run the real one.
- **A contract with no nutrient field.** The proposal has ids, portions (servings, grams or unit × count), items not
  found and at most one question. Zod rejects anything else, so a manipulated answer cannot carry a number.
- **The user confirms.** Cards can be edited, removed or switched to "pending"; "Guardar todo" saves them in one SQLite
  transaction. What the user kept, edited or removed goes back as feedback: free labels for future evals.

## Measuring it

Every call writes an `ai_call` row: tokens (fresh and cached), latency, cost from a dated price table, outcome, tool
rounds and feedback. A CLI prints $ per saved entry, p50/p95 and acceptance for 7 and 30 days. Langfuse gets the
same numbers through its OpenTelemetry endpoint, with the content always masked.

**Evals with exact checks, no LLM judge.** 150 synthetic Spanish phrases in eight categories (simple, several items,
portions, drinks, typos and slang, ambiguous, out of scope, injection). Each expectation is a catalog search, so any
right answer counts; the checks are item F1, meal, portion within ±20%, a question only when needed, injection
ignored. A GitHub Actions gate runs on pull requests that touch the agent and fails on −2 points or +20% cost.

| Run | Score | USD per entry | p95 |
| --- | --- | --- | --- |
| deepseek-flash, prompt v1 (baseline) | 86.6 | 0.00032 | 7.5 s |
| deepseek-v4-pro, prompt v1 | 89.0 | 0.00144 | 13.5 s |
| deepseek-flash, prompt v2 with guardrails | **87.8** | 0.00033 | 7.1 s |

The larger model gained 2.4 points for 4.5× the cost and twice the tail latency; the cheaper model with a better
prompt got most of it back. A deliberately broken prompt scored 49 and failed the gate, which is the point of having
one.

## Guardrails

The worst case of an injection is a wrong proposal the user sees before saving. On top of that: user text is wrapped
as data and cannot close its own tag; deterministic filters drop instructions and non-food items ("dormí 12 horas")
before they reach the phone; a question that quotes the prompt is dropped; 30 logs and USD 0.10 per user per day;
the request carries no identifiers and no journal data. Each OWASP LLM Top 10 (2025) item maps to a control and a test
in `docs/security/llm-threats.md`.

## What failed along the way

- The model wrote readable slugs (`lucuma`, `c47`) instead of catalog ids. A deterministic resolver by name fixed most
  of them; the rest become pending items, never invented foods.
- Prompt v2's first draft asked questions far too often (58 unwanted questions): the score dropped to 80.9 even though
  injection and ambiguity improved. The eval caught it before anyone else did; narrowing the rule brought it to 87.8.
- Injections came back as "pending items": harmless for numbers, ugly for users. A guardrail now filters them.
- Gemini 3 rejects multi-turn tool calls unless its thought signature is sent back; the adapter now passes provider
  fields through.
- Langfuse Cloud deprecated its legacy ingestion and read APIs during the build; traces moved to OpenTelemetry.

## Numbers in production

Dev, before release: 7 calls, $0.0037 in all, p50 2.6 s, p95 8.2 s. Production numbers come from the same CLI.
