# LLM threats: OWASP Top 10 for LLM Applications 2025

How each risk applies to Kawsay's AI features (text logging agent F16, "Crear con IA" F07, insights summary F17), the
control and the test that proves it. Decisions: ADR 0007, 0008, 0013, 0023, 0024, 0026.

| # | Risk | Applies | Control | Test |
| --- | --- | --- | --- | --- |
| LLM01 | Prompt injection | Yes | User text wrapped as data in `<texto_de_la_persona>` (its own closing tag removed); the prompt says the text is data; read-only tools; output validated with Zod; instructions never become pending items (`guardrails.ts`) | `guardrails.spec.ts`; agent spec "ignora tus instrucciones…"; golden set `injection-*` (90 / 100 with prompt v2) |
| LLM02 | Sensitive information disclosure | Yes | The request carries only text, day and band (strict Zod contract, no ids, no journal, no intimate entries); traces masked; errors logged by name only (ADR 0013); input text cleared after 90 days | `text-log.test.ts` (extra field rejected); mobile `api-client.test.ts` (body is exactly the request); `langfuse-trace-sink.spec.ts` (masked span has no text); `TextRetention` |
| LLM03 | Supply chain | Partly | Hosted models through their official HTTPS APIs; no model weights or plugins; dependencies pinned by the lockfile, gitleaks in CI | CI (`pnpm install --frozen-lockfile`, gitleaks) |
| LLM04 | Data and model poisoning | No | No training or fine-tuning; the catalog the agent reads is built from official tables and committed, checked recipes (ADR 0028) | Catalog build tests (`remote-catalog.test.ts`) |
| LLM05 | Improper output handling | Yes | The answer has no nutrient, calorie or free-text instruction field; unknown ids become pending items; portions fitted to real units; the phone computes every number from its table (ADR 0008) | Contracts (`kcal` rejected); agent spec (extra fields stripped, invented id → pending) |
| LLM06 | Excessive agency | Yes | Tools are read-only (search, units); the agent never writes: the user confirms with "Guardar todo"; only meals, never sleep, symptoms, activity or intimate entries | Agent spec; `guardrails.spec.ts` (non-food texts dropped); golden set `out-of-scope-*` (100) |
| LLM07 | System prompt leakage | Yes | Nothing secret in the prompt (keys live in the environment); a question that quotes the prompt is dropped; the prompt is never echoed | `guardrails.spec.ts` (`leaksPrompt`); golden set `injection-02/05/10` |
| LLM08 | Vector and embedding weaknesses | No | No embeddings or vector store: search is a deterministic word match over the catalog | — |
| LLM09 | Misinformation | Yes | The AI never states a nutrient or a calorie; proposals are shown before saving; estimated recipes are labelled "Receta estimada"; insights say they are not a diagnosis (F17) | Golden set scores items, meal and portion with exact checks; CI gate |
| LLM10 | Unbounded consumption | Yes | ≤ 300 characters; ≤ 4 model rounds; 30 text logs and USD 0.10 a day per user (from `ai_call`); 10 AI dishes a day; evals stop above USD 0.50; timeouts on every call | `propose-text-log.use-case.spec.ts` (count and cost caps); agent spec (5th round never asked); `propose-dish.use-case.spec.ts` |
