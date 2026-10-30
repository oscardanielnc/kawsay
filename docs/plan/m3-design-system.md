# M3. Amanecer design system

Goal: the new look as reusable pieces, before touching screens.

## Read

- `docs/design/explorations/2026-10-30-amanecer/README.md` (tokens, gauges) and `Components.dc.html`
- `docs/design/direction.md` (change history: Amanecer), `docs/design/references-2026-10-27.md`
- `apps/mobile/src/lib/theme.ts` and where it is used

## Steps

1. **Tokens:** rewrite `theme.ts` with the Amanecer tokens (names from the README table). Migrate every usage; no old
   colour left. Rewrite `docs/design/tokens.md` to match
2. **Contrast test:** a unit test that lists every text-on-background pair and asserts ≥ 4.5:1 (zone colours are
   never text)
3. **Fonts:** load Plus Jakarta Sans 600/700/800 and Figtree 400–700 at startup (expo-font); remove Bricolage once no
   import is left. Numbers use tabular figures
4. **Background:** `GradientBackground` with `react-native-svg` `LinearGradient` (no expo-linear-gradient)
5. **Components:** `Card`, `Pill` (in range · near · far · neutral), `Chip`, `Button` (primary gradient, secondary),
   `SectionLabel`, `Gauge` (two-sided and one-sided, paths from the README, Reanimated needle), `Face` (grey until
   picked), `FloatingTabBar` (white 92%, shadow, no blur, centre "+"), restyled `Sheet`
6. **Motion:** Reanimated; card rise 420 ms, needle 320–420 ms ease-out, taps 180 ms spring; all off with reduce
   motion
7. `native-manifest.test.ts` green: no new native module

## Done when

- [x] Tokens, fonts, background and components in place; contrast test green
- [x] Gauge tests: value → needle angle for both kinds, zone by threshold
- [x] Screens still work (old layouts with new tokens is fine until M4/M8)

## Build notes (2026-10-30)

- Motion uses React Native's own `Animated`, not Reanimated: with any working Reanimated mock, expo-router's test
  renderer changed its transitions and later presses in `navigation.test.tsx` stopped landing. Both need no native
  module; Reanimated stays installed for a later need
- `Gauge` is `ZoneGauge`: on Windows `Gauge.tsx` and `gauge.ts` are the same file name
- Plus Jakarta Sans loads at startup (OTA-safe). Bricolage stays in `app.config.ts` until the next APK (M9)

