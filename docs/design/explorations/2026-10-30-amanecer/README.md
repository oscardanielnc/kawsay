# Amanecer redesign — mockups (approved 2026-10-30)

Copies of the owner's design canvas "Kawsay — Hoy rediseñado" (claude.ai, private). Approved as the look of the whole
app: "justo así deseo que se vea la app" (design/direction.md, change history). Sample data is invented.

| File | Screen |
| --- | --- |
| [Main.dc.html](Main.dc.html) | Today, full height: header, day checklist, six gauges, meals with a fixed "+", activity, hydration (collapsed), body and mood faces, sleep, symptoms, floating tab bar |
| [Picker.dc.html](Picker.dc.html) | Add food: search, "‹ Resultados", "Guardar como pendiente", portion step with the impact preview on six mini gauges |
| [Analysis.dc.html](Analysis.dc.html) | Insights: week counters, Liver card (F25), AI summary on demand (F17) |
| [Components.dc.html](Components.dc.html) | Palette, type, gauge states, faces, chips and buttons |

## How to read them

- Canvas format: plain HTML and inline CSS inside `<x-dc>`. `{{name}}` holes and `<sc-for list="{{x}}" as="y">` loops
  are filled by the `renderVals()` script at the bottom of each file: read it for the data, states and colours
- `support.js` is the canvas runtime and is not in the repo; the files are a spec, not code to port
- CSS px = React Native dp. Web-only effects have native equivalents: `linear-gradient` → `react-native-svg`
  `LinearGradient`, `box-shadow` → `shadow*` / `elevation`, `backdrop-filter` → none (solid white 92%), CSS
  transitions → Reanimated. No new native module (ADR 0010)

## Tokens

| Token | Value | Use · contrast |
| --- | --- | --- |
| `bg-gradient` | `#CFE3FA` 0% → `#E5EEFB` 30% → `#F4F0F2` 62% → `#FFE4D0` 100% | Screen background, top to bottom |
| `card` | white 82–88%, border white 90%, radius 24, shadow 0 10 28 `rgba(38,72,128,.08)` | Floating cards |
| `ink` | `#1D2B45` | Text · 14.2 on white, 10.8 on `#CFE3FA` |
| `ink-soft` | `#46597A` | Text on the gradient and on tinted surfaces · 5.39 on `#CFE3FA`, 6.6 on `#F5F8FC` |
| `ink-muted` | `#5B6B86` | Secondary text **on white cards only** · 5.4 (fails on the gradient top: 4.12) |
| `surface-2` | `#F5F8FC` | Rows inside cards |
| `line` | `#D5E0EE` | Borders, secondary button outline |
| `blue-300` | `#7FB2F0` | Gauge zone "in range"; never text |
| `blue-500` → `blue-700` | `#4C8DE6` → `#2563B8` | Primary button and tab "+" (gradient); white text 5.91 on `#2563B8` |
| `blue-800` on `blue-50` | `#1C4F96` on `#E6F0FD` | "En rango" pill, chips · 7.0 |
| `amber-300` | `#F6D08D` | Gauge zone "near"; never text |
| `amber-800` on `amber-50` | `#8A5300` on `#FDF0DC` | "Cerca" pill · 5.63 |
| `coral-300` | `#F3A99F` | Gauge zone "far"; never text |
| `coral-800` on `coral-50` | `#9E2F22` on `#FCE4DF` | "Lejos" pill · 6.0 |
| `peach-300` | `#FFC9A3` | Pending items |
| `peach-800` on `peach-50` | `#8A4513` on `#FFF1E6` / `#FFF8F1` | Sugar block, AI suggestion banner · 6.7 |
| `neutral-pill` | `#46597A` on `#EEF1F6` | "Below, the day goes on" (calories under target during the day: grey, no alarm) · 6.24 |
| `face-off` | fill `#DCE2EA`, strokes `#8D99AE` | Faces before one is picked; the label below carries the meaning |

Faces when picked (left = most negative, in all three scales): `#E85D4F` · `#F2994A` · `#F2C14E` · `#F7D85C` ·
`#FFCB2F`, scale 1.14.

Type: **Plus Jakarta Sans** 800 (screen titles 34, numbers with tabular figures), 700 (card titles 18) · **Figtree**
400–700 (body 15/22, labels 13, captions 12). Uppercase section labels 13, weight 700, letter-spacing 0.04 em.

Space and shape: 4-pt scale; screen padding 20; card padding 16–18; gap between cards 16; radii 24 cards · 16–18
inner blocks · 12 small buttons · 999 pills; touch targets ≥ 44; floating tab bar 72 high, radius 30, 16 from the
edges and 24 from the bottom, centre "+" 56.

Motion: cards rise 8 px and fade in 420 ms ease-out; gauge needles sweep 320–420 ms ease-out; taps 180 ms spring;
everything off with the system "reduce motion".

## Gauges

- Arc: centre (100, 100), radius 78, from 180° to 0°; needle = rotate(f × 180°) around the centre
- **2026-11-01: zones are now at real scale (ADR 0027)**; the fixed paths below are history, kept for reference.
- Two-sided zones at fixed fractions 10 · 18 · 44 · 18 · 10% (coral · amber · blue · amber · coral). Paths:
  `M 22.0 100.0 A 78 78 0 0 1 25.0 78.7` · `M 26.8 73.1 A 78 78 0 0 1 48.1 41.8` ·
  `M 52.6 38.1 A 78 78 0 0 1 147.4 38.1` · `M 151.9 41.8 A 78 78 0 0 1 173.2 73.1` · `M 175.0 78.7 A 78 78 0 0 1 178.0 100.0`
- One-sided (added sugar, refined flours) 3/7 · 2/7 · 2/7 (blue · amber · coral):
  `M 22.0 100.0 A 78 78 0 0 1 79.8 24.7` · `M 85.5 23.4 A 78 78 0 0 1 146.3 37.2` · `M 150.9 40.9 A 78 78 0 0 1 178.0 100.0`
- Range thresholds stay as in design/direction.md; only the colours change (green → blue, yellow → amber, red → coral)
