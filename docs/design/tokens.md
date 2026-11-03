# Design tokens — Amanecer

Approved 2026-10-30 ([explorations/2026-10-30-amanecer](explorations/2026-10-30-amanecer/README.md)). Code:
`apps/mobile/src/lib/theme.ts`. Every text-on-background pair is listed in `src/lib/theme.test.ts`, which fails
under 4.5:1. Zone colours (`*-300`) are never text.

## Color

| Token | Value | Use · contrast |
| --- | --- | --- |
| `gradient` | `#CFE3FA` → `#E5EEFB` → `#F4F0F2` → `#FFE4D0` | Screen background, top to bottom (`GradientBackground`) |
| `card` | `#FFFFFF` (cards at 88% over the gradient) | Cards and sheets |
| `ink` | `#1D2B45` | Text · 14.2 on white, 10.8 on the gradient top |
| `ink-soft` | `#46597A` | Text on the gradient and on tinted surfaces · 5.39 on `#CFE3FA` |
| `ink-muted` | `#5B6B86` | Secondary text **on white only** · 5.4 (4.12 on the gradient top: not allowed) |
| `surface-2` | `#F5F8FC` | Rows inside cards |
| `line` | `#D5E0EE` | Borders, secondary button outline |
| `chip` | `#EEF3FA` | Logged-item chips |
| `blue-300` | `#7FB2F0` | Gauge zone "in range"; never text |
| `blue-500` → `blue-700` | `#4C8DE6` → `#2563B8` | Primary button and tab "+" gradient · white text 5.91 |
| `blue-800` on `blue-50` | `#1C4F96` on `#E6F0FD` | "En rango" pill, selected options · 7.0 |
| `amber-300` | `#F6D08D` | Gauge zone "near"; never text |
| `amber-800` on `amber-50` | `#8A5300` on `#FDF0DC` | "Cerca" pill · 5.63 |
| `coral-300` | `#F3A99F` | Gauge zone "far"; never text |
| `coral-800` on `coral-50` | `#9E2F22` on `#FCE4DF` | "Lejos" pill, errors · 6.0 |
| `peach-300` | `#FFC9A3` | Pending items (dashed border) |
| `peach-800` on `peach-50` | `#8A4513` on `#FFF1E6` | Pending chip, sugar notes · 6.7 |
| `neutral` | `#46597A` on `#EEF1F6` | "Below, the day goes on": calories under target during the day · 6.24 |
| `no-data` | `#C9D3E1` | Gauge without data; never text |
| `face-off` | fill `#DCE2EA`, strokes `#8D99AE` | Faces before one is picked; the label carries the meaning |
| `face` (picked) | `#E85D4F` · `#F2994A` · `#F2C14E` · `#F7D85C` · `#FFCB2F` | Left = most negative in every scale |

Illustrations (food icons, Bristol drawings, the drinks bucket) keep their own colours; they are never text.

## Type

| Token | Font | Size / line |
| --- | --- | --- |
| `display` | Plus Jakarta Sans 800 | 34 / 40 (screen titles) |
| `title` | Plus Jakarta Sans 800 | 22 / 28 (sheet titles) |
| `heading` | Plus Jakarta Sans 700 | 17 / 22 (card titles) |
| `number` | Plus Jakarta Sans 800, tabular figures | 26 / 30 (gauge values) |
| `body` | Figtree 400 | 15 / 22 |
| `label` | Figtree 600 | 13 / 18 |
| `caption` | Figtree 400 | 12 / 16 |
| `section` | Figtree 700, uppercase, +0.5 letter spacing | 13 / 18 |

Figtree 400/600 are embedded in the APK; Plus Jakarta Sans 700/800 and Figtree 700 load at startup (`useAppFonts`),
so they ship by OTA update. Bricolage Grotesque leaves `app.config.ts` with the next APK (no import uses it).

## Space, shape, motion

- 4-pt scale (`space` 4 · 8 · 12 · 16 · 24 · 32); screen padding 20; 16 between cards; 120 under tab content for
  the floating bar
- Radii: 24 cards · 16 inner blocks and buttons · 12 chips and small buttons · 999 pills; touch targets ≥ 44
- Card shadow `0 10 28 rgba(38,72,128,.08)` (elevation 3); floating tab bar white 92%, 72 high, radius 30, centre
  "+" 56, no blur
- Motion (React Native `Animated`, no native module): cards rise 8 px and fade in 420 ms; gauge needles sweep 380 ms
  ease-out; everything jumps to its end with the system "reduce motion"

## Gauges

`ZoneGauge` (`src/components/data-display`): arc centre (100, 100), radius 78; zone paths computed by `zonePaths`
(`gauge-zones.ts`) from each zone's share, a 4.3° gap between zones, never thinner than 1°; "+" after the number
past the maximum.
~~Two-sided (calories, macros) coral 10 · amber 18 · blue 44 · amber 18 · coral 10 %; one-sided (added sugar, refined
flours) blue 3/7 · amber 2/7 · coral 2/7.~~ **Replaced by ADR 0027 (2026-11-01): zones at real scale**, computed by
`packages/core` `gauge/scale`. Thresholds stay as in [direction.md](direction.md).
