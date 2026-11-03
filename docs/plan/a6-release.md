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
