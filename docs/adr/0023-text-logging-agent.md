# 0023. Text logging agent: read-only tools on the API, proposal on the phone

- Status: Accepted (owner, 2026-10-31: plan "IA medida")
- Date: 2026-10-31

## Context

F16: "almorcé chaufa e Inca Kola" should become meal entries. ADR 0008: the AI picks, the table computes. A single
prompt that returns food names cannot know what the catalog holds, so most names would end as "not found".

## Options considered

- One call that returns names, matched afterwards: no grounding in the catalog
- An agent framework (LangChain, Vercel AI SDK): an extra layer for two tools, harder to trace and test
- **A small tool-calling loop over the OpenAI-compatible API, read-only tools, structured proposal, user confirms**: chosen

## Decision

- `POST /v1/ai/text-log` `{ text ≤ 300, localDate, timeBand }` → `TextLogProposal`;
  `POST /v1/ai/text-log/:id/feedback` with what the user kept, edited or removed
- Tools, arguments validated with Zod: `search_catalog(query, kind: food | dish)` over `packages/catalog` and the
  user's synced dishes · `get_units(id)` for household units. The final answer is a structured `propose_entries`
- Proposal: entries `{ meal, catalogId, portion: servings | grams | unit × count, confidence }`, `unmatched[]`
  (they become pending entries, F23), `question?` ≤ 120 only when one detail changes the result
- **The schema has no nutrient or calorie field**: the phone computes them from the catalog
- At most 4 tool rounds and 1 retry on invalid output; `deepseek-flash` with low reasoning effort (ADR 0007)
- Every call stores an `ai_call` row (ADR 0024); the agent has no tool that reads the journal, so it never sees
  intimate entries or other days

## Consequences

- The user's edits on confirmation are free labels for the evals (ADR 0025)
- Offline the text box says "sin conexión"; the manual search still works
