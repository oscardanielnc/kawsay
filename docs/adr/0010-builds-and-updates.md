# 0010. Two app variants, development builds and over-the-air updates

- Status: Accepted
- Date: 2026-10-07

## Context

Development produces many versions. Installing an APK per change is not acceptable.

## Options considered

- New APK per version: slow, clutters the phone
- Self-hosted update server on the VM: no vendor dependency, more work now
- **EAS Build + EAS Update** (free plan: 15 Android builds and 1,000 update users per month, as of 2026-10)

## Decision

- Two variants side by side: `Kawsay Dev` (`dev.oscarnavarro.kawsay.dev`, dev API) and `Kawsay`
  (`dev.oscarnavarro.kawsay`, prod API), selected with `APP_VARIANT`
- Day to day: one development build + Metro, changes appear live
- Personal use: JavaScript changes ship through EAS Update channels; a new APK only for native changes,
  installed over the previous one

## Consequences

- A broken dev build never touches real data
- If EAS limits or terms change, move to a self-hosted update server
