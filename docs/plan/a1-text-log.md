# A1. Log by text

Goal: "almorcé chaufa e Inca Kola" → proposal cards → "Guardar todo" (F16).

## Read

- F16, F05, F23, ADR 0008, 0023, 0024 (only the `ai_call` table), 0026; `packages/catalog`, contracts, sync

## Steps

1. **Contracts** (`packages/contracts`): `TextLogRequest`, `TextLogProposal`, `TextLogFeedback` in Zod, with tests.
   No nutrient field anywhere
2. **API, hexagonal:** `AiPort.proposeTextLog()`; the DeepSeek adapter runs the tool loop (OpenAI-compatible
   `tools`, at most 4 rounds, 1 retry on invalid output). Tool handlers call the catalog module's application
   services (curated foods and dishes first, then generic INS foods, then the user's synced dishes). Prompt in
   Spanish with a version constant (`text-log.v1`)
3. **Endpoints:** `POST /v1/ai/text-log` and `POST /v1/ai/text-log/:id/feedback`, authenticated, throttled
4. **`ai_call` table** (new table, Prisma migration): fields of ADR 0024; cost from a per-model price config
5. **Phone:** the "✍️ Escribir lo que comí" field (add sheet and quick-log "+"), proposal cards, pending cards for
   unmatched items, the question as chips, portion preview, "Guardar todo" in one transaction (`inTransaction()`),
   then the feedback call. Spanish strings through i18n
6. **Tests:** contracts; the agent loop with a scripted fake model (tool call → result → proposal, invalid → retry,
   5th round → error); tool handlers; the phone confirm flow (RNTL); the request carries no identifiers or journal data

## Done when

- [x] F16 criteria pass against the fake model; build notes in F16 and ADR 0023
- [x] Deployed to dev (pre-approved) and a few live tries against dev pass; their cost goes in the final report.
      Prod and the app update wait for A6
