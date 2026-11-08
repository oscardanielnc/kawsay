# Build plans

**When Oscar says "actualiza el proyecto" (or "sigue con el plan", "continúa"), run the first milestone of the active
plan below that is not ✅.** The active plan runs in **continuous mode**: A0 → A6 in one go (section below).

## Last plan: Kawsay with measured AI (approved by the owner 2026-10-31, done 2026-11-03)

Why: it closes the AI Engineer gaps the owner's job search found (an agent with tools and confirmation, traces and
cost, evals with a CI gate, guardrails), on the one app with real daily use. Publishing on Play Store is not part of
this plan.

| # | Milestone | Main docs | Status |
| --- | --- | --- | --- |
| [A0](a0-setup.md) | Setup: baseline, README up to date, check the AI API | this plan | ✅ 2026-11-03 |
| [A0b](a0b-real-scale-gauges.md) | Gauges at real scale (owner's correction, 2026-11-01) | ADR 0027 | ✅ 2026-11-03 |
| [A0c](a0c-gauge-detail.md) | Gauge detail: big gauge with labelled limits + what added most (owner, 2026-11-01) | F26 | ✅ 2026-11-03 |
| [A0d](a0d-thousands-of-dishes.md) | Thousands of dishes: 544 INS dishes (data ready), AI recipes, catalog by sync, "Crear con IA" (owner, 2026-11-02) | ADR 0028 · F23 | ✅ 2026-11-03 |
| [A1](a1-text-log.md) | Log by text: agent with tools, proposal, confirmation | F16 · ADR 0023 | ✅ 2026-11-03 |
| [A2](a2-traces.md) | Traces and cost per entry | ADR 0024 | ✅ 2026-11-03 |
| [A3](a3-evals.md) | Evals: golden set, CI gate, model comparison, Python report | ADR 0025 | ✅ 2026-11-03 |
| [A4](a4-guardrails.md) | Guardrails and the OWASP map | ADR 0026 | ✅ 2026-11-03 |
| [A5](a5-tell-it.md) | Tell it: README with numbers, write-up, CV line | — | ✅ 2026-11-03 |
| [A6](a6-release.md) | Release | runbooks | ✅ 2026-11-03 |

Owner's choices (2026-10-31): traces in **Langfuse Cloud** (EU, free, masked content; ADR 0024) · AI budget about
USD 5 a month for evals and his own use · keep DeepSeek and compare it with `deepseek-v4-pro` and a Gemini Flash-Lite.

## Continuous mode (owner, 2026-10-31: "no quiero parar la ejecución a la mitad")

- Owner's hard rule (2026-11-03): app updates go straight to production, never through Kawsay Dev; keep the
  rollback group id
- Run A0 → A0b → A0c → A0d → A1 … A6 without waiting between milestones: finish one, merge it into `main` (`git merge --ff-only`), tick it
  ✅ with the date, start the next. Questions that do not block go into the final report
- **Pre-approved for this plan:** installing packages · additive migrations (new tables, nullable columns) ·
  `git push` of branches and `main` to `origin` (after gitleaks passes) · deploying the API to **dev** at any time ·
  live AI calls within the budget · in A6, deploying **prod** and publishing the **EAS Update**, with the safeguards
  written there
- **Keys are ready** as user environment variables (the owner ran his setup script before starting):
  `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`; the GitHub
  Actions secret `DEEPSEEK_API_KEY` is set. Never print, log or commit their values; read them only from the
  environment
- **Still stop and ask** (only these): red tests before any change · anything that needs a new APK · a migration that
  rewrites or deletes rows · total live AI spend of the plan above USD 5 · making the repo public, or publishing a
  post, the site or the CV · a key that is missing or rejected · a prod deploy or health check that fails
- One final report at the end (below), plus one lesson per new concept in the vault as you go

Baseline (A0, 2026-11-03): 716 tests green (core 250 · mobile 362 · catalog 61 · api 37 · contracts 6); repo private

## How to run a milestone

1. `git status`: uncommitted changes you did not make → stop and ask. **Expected exception:** docs written by the
   owner's planning chat (2026-10-31 to 11-02: `docs/plan/`, `docs/adr/0023`–`0028`, F07, F16, F22, F23, F24, F26, design docs,
   `packages/catalog/scripts/build_ins_dishes.py`, `seed/generated/ins-dishes.json`, `reports/ins-dishes.md` and
   `design/explorations/2026-11-01-gauge-detail.html`).
   Commit them first as `docs: plan measured AI, gauges, gauge detail and thousands of dishes`, then go on
2. Outside continuous mode, a milestone "⏳ waiting for approval" is approved by the trigger phrase: merge it, tick it
3. `git switch -c plan/aN-<slug>` from `main`
4. Read the milestone file and every doc it lists. If a doc and this plan disagree, the doc wins; if something is
   unclear about Oscar's data or wishes, ask (his vault is the source: `D:\OSCAR\Documents\Obsidian-Oscar`)
5. Install what it needs, then build in small commits: tests first, English conventional commits, no AI marks, docs in
   the same commit (criteria `[x]`, build notes, ADR updates)
6. `pnpm check` and `pnpm test` green before the last commit
7. In continuous mode: merge, tick ✅ and go on. Otherwise mark it "⏳ waiting for approval" and report

## Report to Oscar (Spanish, short, visual; in continuous mode, once at the end)

- ≤ 25 lines: ✅ what changed per milestone · 🧪 how to try it · 💵 AI spend · 📊 eval numbers · ⚠️ pending or doubtful
- Teacher mode for each new concept: qué · por qué · cómo funciona por dentro · cómo defenderlo en una entrevista;
  new concepts also become a lesson in the vault (`Knowledge\Lecciones\`, CLAUDE.md)
- Close with: "¿Lo apruebas? Di «actualiza el proyecto» para aprobar y seguir, o dime qué cambiar."

## Stop and ask first (outside continuous mode)

- A new native module or anything that needs a new APK (ADR 0010, `src/native-manifest.test.ts`)
- Deploying the API (`deploy/deploy.sh`, dev or prod) or publishing an EAS Update (`release` script)
- A database migration that rewrites or deletes existing rows (adding tables or nullable columns is fine)
- `git push`, changing repo visibility, publishing anything, or sending health data off the phone in a new way
- Spending money, creating accounts or adding API keys: Oscar does it; give him **one** command or one link
- A live AI run expected to cost more than USD 0.50

## Always

- Try things on **Kawsay Dev** with invented data, never on the real account. Oscar's health data never goes into
  docs, fixtures, tests, eval sets or commits
- Order when contracts change: deploy the API first (it keeps answering the old app), then the app update
- Design: Amanecer tokens and components ([design/explorations/2026-10-30-amanecer](../design/explorations/2026-10-30-amanecer/README.md))

## Pending (owner, 2026-11-03)

- **F23 piece 3, own food from a label** ("el 1 para después"): type a label per 100 g or per serving, later read
  from a photo by a vision model with each number confirmed. Write it as a plan when the owner asks for it

## Done

- **First version closed** (2026-11-08): logged meals edit their amount, the add button keeps its label after
  "Ver fuentes", F17 relations pass Fisher + Benjamini–Hochberg (garnishes under 25 g do not count), the AI summary
  has its own evals (v1 67.5 → v2 100) and a CI gate, and the logo (new APK pending for the launcher). Production
  update group `fc17813a-87cc-49ec-9f1a-f392b39aacaf`; rollback group `8bd518d9-79d8-486c-8517-20e522334906`

- **Owner's corrections** (2026-11-04): times in two taps (`TimeField`), naps keep their place, catalog read once
  (logging ~2 s → instant), F17 relations compare foods only with gut symptoms and the AI never ties mood or mouth
  ulcers to a food. Production update group `8bd518d9-79d8-486c-8517-20e522334906`; rollback group
  `5eb222ed-0dde-49fd-821a-ce1956ea2312`

- **Measured AI** (2026-11-03): A0–A6 ✅; the owner logged real meals by text in production. Then F24's weekly
  insight "¿De dónde vienen tus calorías?" (F24 and F25 were already built in M4 and M6). Production update group
  `5eb222ed-0dde-49fd-821a-ce1956ea2312`; rollback group `b8398e93-6072-4c63-8184-15867f289962`

- **Amanecer redesign + liver targets** (2026-10-30): M0–M9 ✅, released to the owner's phone on 2026-10-30
  ([m0](m0-setup.md) … [m9](m9-release.md) kept as history). Baseline then: 628 tests
