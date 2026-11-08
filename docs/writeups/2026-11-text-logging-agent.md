# A text logging agent that cannot invent a calorie

*Kawsay, November 2026 (updated 2026-11-08). Every example and number here comes from synthetic data.*

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

## The second AI feature: a summary that only says what the data supports

Kawsay also explains which habits line up with the user's symptoms. Two layers can go wrong here, and each got its
own test.

**The statistics, on the phone.** The app compares days after an exposure (a food, short sleep, a long motorbike
ride) with the user's other days. With hundreds of foods tested against each gut symptom, some always line up by
chance. Real use showed it: a fruit eaten most days came up as a cause, and so did an ingredient nobody eats on
purpose, a 10 g garnish inside a dish. Now every pair needs a two-sided Fisher exact test that survives Benjamini–Hochberg over
all the pairs tested (q ≤ 0.1), and an ingredient counts as eaten only from 25 g. A test seeds 60 random foods over 42
days and expects zero relations; a planted dairy → bloating effect still comes through. Days that are close together
are not independent (the window is 48 h), so this is a filter, not proof of a cause.

**The model, on the API.** A 20-case synthetic set feeds the real adapter and prompt: relations grounded in the data,
foods that appear only in notes, mood (never blamed on a food), warning signs, too few days, and injections hidden in
notes. The checks are exact again: the answer passes the contract, every food it names was in the phone's counts,
every "N of M" it quotes was in the request, and warning signs appear exactly when the notes call for them.

| Summary prompt | Score | Passes the contract | Food claims grounded |
| --- | --- | --- | --- |
| v1 (in production) | 67.5 | 70% | 85.7% |
| v2 | **100** (3 runs) | **100%** | **100%** |

The first run found a production bug nobody had reported: 30% of summaries had a habit longer than 80 characters, and
the retry asked the same question and got the same answer. The fix sends the contract's error back as the second turn
("habits.0: too big, max 80"), paths and limits only. A new rule makes food findings come only from the phone's
counts. One golden case was wrong (an alcohol relation that was in the data); it was corrected and v1 re-scored, which
is why the table says 67.5 and the raw file says 66.3. A CI step fails if the summary score drops 5 points.

## Numbers in production

Dev, before release: 7 calls, $0.0037 in all, p50 2.6 s, p95 8.2 s. Production, first day: 3 calls, $0.00055 per
saved entry, p50 2.9 s, p95 6.6 s, every proposal saved as is (2 of 2). Same CLI, so the numbers stay comparable.
