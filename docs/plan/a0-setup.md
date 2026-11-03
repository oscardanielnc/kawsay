# A0. Setup

Goal: a green start, an honest README, and the facts the agent needs from the AI provider.

## Read

- This plan, F16, ADR 0007, 0008, 0013, 0022, 0023–0026
- `apps/api/src/modules/ai` (port, DeepSeek adapter, prompts) and how insights call it

## Steps

1. `pnpm install`, `pnpm check`, `pnpm test`; write the baseline line in the plan. Red before any change: stop
2. **README:** it still says "construction starts". Rewrite it: what Kawsay is, in daily use since October 2026,
   the real layout (only packages that exist), how to run it, links to docs. No personal data
3. **DeepSeek facts** from the official docs (api-docs.deepseek.com): tool calling format, structured output, the
   reasoning-effort parameter for `deepseek-flash`, current prices per 1M tokens (in / cached / out) with the date.
   Write them as build notes in ADR 0023
4. **Keys check, without printing values:** the five environment variables exist and are not empty; one cheap
   call each proves the DeepSeek and Gemini keys work and the Langfuse keys authenticate; `gh secret list` shows
   `DEEPSEEK_API_KEY`. Anything missing or rejected: stop and tell Oscar which one
5. `gh repo view --json visibility`: write it in the final report (no change)

## Done when

- [ ] Baseline recorded; README rewritten; DeepSeek facts in ADR 0023; keys checked
