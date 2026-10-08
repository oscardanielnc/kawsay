# @kawsay/mobile

Expo SDK 57 app (Android first), offline-first (ADR 0002, 0004). Routes in `app/` (Expo Router), everything else in
`src/`: `features/<feature>/` (screens, hooks, local queries), `components/` shared by role, `lib/` (i18n, time zone).

| Command                              | Does                                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| `pnpm --filter @kawsay/mobile start` | Metro for the development build on the phone                                       |
| `pnpm --filter @kawsay/mobile test`  | Jest with `jest-expo` and React Native Testing Library 14 (async `render`)         |
| `pnpm --filter @kawsay/mobile build` | `expo export` of the Android bundle: proves Metro resolves every workspace package |

## Variants (ADR 0010)

`APP_VARIANT=development` (default) builds **Kawsay Dev** (`dev.oscarnavarro.kawsay.dev`); `production` builds
**Kawsay** (`dev.oscarnavarro.kawsay`). Both install side by side. Profiles in `eas.json`.

## Rules enforced by lint

- No hard-coded text in JSX: every string goes through `t()` (ADR 0006)
- A feature never imports another feature; `components/` and `lib/` never import features or routes (ADR 0003)
- Business rules come from `@kawsay/core`, never from screens
