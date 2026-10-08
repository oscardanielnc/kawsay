# 0010. Two app variants, development builds and over-the-air updates

- Status: Accepted (updated 2026-10-08: personal APK, fingerprint runtime)
- Date: 2026-10-07

## Context

Development produces many versions. The owner uses the app several times a day, away from the laptop, and keeps
a permanent history: installing an APK per change, or depending on Metro, is not acceptable.

## Options considered

- New APK per version: slow, clutters the phone
- Self-hosted update server on the VM: no vendor dependency, more work now
- **EAS Build + EAS Update** (free plan: 15 Android builds and 1,000 update users per month, as of 2026-10)

## Decision

- Two variants side by side: `Kawsay Dev` (`dev.oscarnavarro.kawsay.dev`, dev API) and `Kawsay`
  (`dev.oscarnavarro.kawsay`, prod API), selected with `APP_VARIANT`
- Development: one development build + Metro, changes appear live; never used for real data
- Daily use: the `personal` EAS profile builds a standalone `Kawsay` APK on the `production` channel; it runs
  without the laptop
- JavaScript changes ship with `pnpm --filter @kawsay/mobile release` (EAS Update). The app downloads on launch
  and applies the new version on the next launch
- `runtimeVersion` uses the **fingerprint** policy: an update reaches only builds with the same native part, so
  incompatible code never lands. Native changes need a new APK, installed over the previous one
- Native modules planned for v0.1 are added together before the first personal APK, so new APKs are rare

## Consequences

- Updates replace code, never data: the SQLite database survives updates and APK reinstalls with the same
  package and signing key (EAS keeps the key). Uninstalling the app deletes local data until sync (F02) exists
- Database migrations ship inside updates, so they need tests before every release
- If EAS limits or terms change, move to a self-hosted update server
