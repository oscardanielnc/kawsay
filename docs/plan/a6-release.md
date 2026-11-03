# A6. Release

1. `pnpm check`, `pnpm test`, `pnpm evals` at or above the baseline
2. Deploy the API to dev and pass the checks of `docs/runbooks/deploy.md` plus a live text log
3. **Prod (pre-approved, with safeguards):** confirm last night's prod backup exists (`docs/runbooks/backup-restore.md`),
   deploy prod, `/v1/health` green, both insight endpoints and text logging answer. Any failure: stop, do not publish
   the app update, report
4. **EAS Update (pre-approved):** only after prod is green. Anything needing a new APK: stop (ADR 0010). Write the
   update id in the report so it can be rolled back
5. Vault (Spanish, short): one entry at the top of `log.md` and a status line in `Projects\Idea-nutricion-dinamica.md`
6. Mark the plan ✅ with the date and send the final report

## Done when

- [ ] Oscar logs a real meal by text on his phone

## Run notes (2026-11-03)

- Checks green (gate, 378 mobile tests); evals 87.8 ≥ baseline 86.6
- Dev deployed and live text log OK; prod backups of 03:15 UTC and a fresh one at 21:35 UTC, then prod deployed:
  health, text log, catalog sync, `insights/analyze` 200; `insights/summary` gave one 503 (invalid AI output twice,
  pre-existing) and 200 on retry. Synthetic check account `release-check@kawsay.test` created on prod
- EAS Update to `development` (Kawsay Dev): group `58139039-acff-4dcf-9b59-3a53b01c8a10`. Production waits for the
  owner to open Kawsay Dev (memory rule after the 2026-10-30 incident). Rollback target for production: group
  `afcd81bd-4267-432d-826e-2304ad568581` ("Today polish")

