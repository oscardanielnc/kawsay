# M9. Release to Oscar's phone

Goal: everything live, safely. Every step that ships asks first.

## Steps

1. `pnpm check`, `pnpm test`; every "on the phone" criterion checked by Oscar on Kawsay Dev
2. Ask Oscar to export a backup from the real app (F15) and keep it
3. API: deploy **dev**, check `/v1/health` and a sync from Kawsay Dev; then ask and deploy **prod**
   (`docs/runbooks/deploy.md`)
4. App: ask, then publish the EAS Update to production (`release` script). If anything needs a new APK, stop: that is
   a separate decision (ADR 0010)
5. Vault (Spanish, short): one entry at the top of `D:\OSCAR\Documents\Obsidian-Oscar\log.md` and a status line in
   `Projects\Idea-nutricion-dinamica.md`
6. Mark every milestone ✅ and close the plan with the date

## Done when

- [ ] Oscar sees the new app on his phone with his data intact
