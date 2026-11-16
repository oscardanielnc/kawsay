# Engineering highlights

A two-minute read of what this repository shows. Numbers verified on 2026-11-16; every AI number comes from
synthetic data.

## At a glance

| | |
| --- | --- |
| What | Offline-first Android journal for food, activity, body and mood, in daily use by its author since October 2026 |
| Built | 2026-10-07 → 2026-11-12, 198 commits, one author |
| Tests | 967 green: mobile 406 · core 364 · API 103 · catalog 79 · contracts 15, plus API e2e on a throwaway Postgres |
| Docs | 29 ADRs (discarded options included) · 26 features with acceptance criteria · deploy and backup runbooks |
| Running | API on an Oracle Cloud VM (Docker Compose, Cloudflare Tunnel); app 0.2.0 by APK plus over-the-air updates |

## AI that is measured

One rule for every AI feature: **the AI picks, the table computes** ([ADR 0008](adr/0008-ai-picks-table-computes.md)).
No model ever produces a nutrient.

| Feature | How it works | Evidence |
| --- | --- | --- |
| Log by text | Tool-calling agent (3 tools, ≤ 4 rounds, no framework) behind a port; Zod contract with no nutrient field; the user confirms ([ADR 0023](adr/0023-text-logging-agent.md)) | 150-case eval: 87.8 at USD 0.00033 per entry, p95 7.1 s |
| AI summary | Contract-checked reading of on-phone statistics; retries with the validation error ([ADR 0022](adr/0022-ai-summary-endpoint.md)) | 20-case eval: 67.5 → 100; found an unreported production bug |
| Label from a photo | Vision model reads the nutrition table to JSON; Atwater energy check, one corrected retry, user confirms each number; photo never stored ([ADR 0029](adr/0029-label-reading-with-vision.md)) | Live check: 11 of 11 numbers exact in 4 s, ≈ USD 0.0002 a label |

- **Evals with exact checks, no LLM judge**, and a GitHub Actions gate (−2 points or +20% cost fails; a broken prompt
  scored 49 and failed) — [ADR 0025](adr/0025-evals-and-ci-gate.md), [report](../evals/analysis/report.md)
- **Model choice on numbers:** a 4.5× pricier model gained 2.4 points with twice the tail latency; a better prompt on
  the cheaper model won
- **Traces and cost per call** in Postgres and Langfuse over OpenTelemetry, content masked — [ADR 0024](adr/0024-ai-traces-and-cost.md)
- **Guardrails:** user text as data, deterministic filters, per-user daily caps, no identifiers sent; OWASP LLM Top 10
  mapped to controls and tests — [llm-threats.md](security/llm-threats.md)
- **Statistics on the phone:** food → symptom relations pass Fisher's exact test and Benjamini–Hochberg (q ≤ 0.1);
  60 random foods over 42 days give zero relations

Full story: [write-up](writeups/2026-11-text-logging-agent.md).

## Engineering

- **Monorepo** (Turborepo, pnpm): mobile app, API, pure `core` rules and Zod `contracts` shared by both
- **Offline-first mobile:** Expo SDK 57 / React Native, SQLite + Drizzle, push/pull sync with an outbox fed by
  triggers, soft deletes ([ADR 0004](adr/0004-offline-first-sync.md), [ADR 0018](adr/0018-sync-storage-and-change-tracking.md))
- **Hexagonal NestJS API** with ports as abstract classes; AI providers are adapters, tests use a scripted fake model
- **TDD on pure rules:** one rule per file with its test; acceptance-criteria examples appear verbatim in test names
- **Delivery:** CI runs gitleaks over the full history, then lint, typecheck, test and build; over-the-air updates
  keep a rollback group; encrypted backups with a restore runbook
- **Privacy:** health data never reaches a log; intimate entries stay locked on the phone and never reach the AI
  ([ADR 0013](adr/0013-sensitive-data.md))

## Honest limits

Small synthetic golden sets; one real user; the gate catches regressions, not absolute quality; not on the Play Store.
