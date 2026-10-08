# Design tokens

All text pairs meet WCAG AA (≥ 4.5:1); non-text indicators ≥ 3:1 or carry an icon. Values checked 2026-10-07.

## Color

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#F6F2E8` | App background (warm cream) |
| `surface` | `#FFFFFF` | Cards |
| `ink` | `#1C1F1A` | Primary text (14.9:1 on bg) |
| `ink-muted` | `#5E6358` | Secondary text (5.5:1 on bg) |
| `brand` (green-800) | `#1F4D3A` | Headers, tab bar active, brand (8.6:1 on bg) |
| `accent` (cocona) | `#B84E18` | Primary actions: Confirm, Add (white text 5.1:1) |
| `green-50…900` | `#EEF6F0 #D5EBDB #B4DBBF #86C497 #5BA66E #3E8A55 #2E7346 #255E3B #1F4D3A #163829` | Scale |
| `range-green` (green-300) | `#86C497` | Green zone of range bars |
| `day-good` (green-400) | `#5BA66E` + check icon | Calendar good day |
| `success-text` (green-700) | `#255E3B` | "On target" labels (6.9:1 on bg) |
| `range-yellow` | `#EBC867` | Yellow zone; never text |
| `warning-text` | `#9A6B00` | Warning labels on white (4.7:1) |
| `range-red` | `#E58B7A` | Red zone; never text |
| `danger-text` | `#B3392F` | Error labels (5.3:1 on bg) |
| `no-data` | `#B9B6AE` | Grey days; never text |

## Type

| Token | Font | Size / line |
| --- | --- | --- |
| `display` | Bricolage Grotesque 700 | 32 / 36 (ring number) |
| `title` | Bricolage Grotesque 700 | 22 / 28 |
| `heading` | Bricolage Grotesque 600 | 17 / 22 |
| `body` | Figtree 400 | 15 / 22 |
| `label` | Figtree 600 | 13 / 18 |
| `caption` | Figtree 400 | 12 / 16 |

## Space, shape, motion

- Spacing: 4-pt scale (4, 8, 12, 16, 24, 32)
- Radii: 8 (chips, inputs), 14 (cards), 999 (pills, glasses)
- Touch targets ≥ 44 × 44
- Motion: 180 ms taps (spring), 320 ms ring and bar changes (ease-out), 400 ms screen transitions;
  every animation off with the system "reduce motion" setting
