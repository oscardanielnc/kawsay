# Redesign references — premium look (2026-10-27)

- Status: Research done · directions not built yet · nothing approved
- Why: the owner wants the app to look much more elegant, "like an iOS app that looks expensive and beautiful"
  (2026-10-27). The current direction (P1 Selva, T2, S1 + S2) stays valid until a new one is approved

## Where to look

| Site | What it has | Cost (Oct 2026) |
| --- | --- | --- |
| Mobbin | 620k+ screens and 150k+ flows of shipped apps, filterable by category (Health & Fitness) | Limited free plan · USD 10/mo yearly |
| Refero | 145k+ screens, 12k+ flows | Free tier (~3% of the library) · USD 10/mo yearly |
| Page Flows | Annotated video journeys (onboarding, logging) | 3-day trial · USD 8.25/mo yearly |
| Apple Design Awards | Yearly winners and finalists: the reference for craft on iOS | Free |
| Apple Human Interface Guidelines | The rules behind the iOS look: materials, typography, layout, motion | Free |
| Dribbble / Behance | Concepts, not shipped apps: use for mood, never as proof something works | Free |

Source for the gallery figures: Mobbin's own comparison (it sells Mobbin), checked October 2026.

## Apps worth studying

| App | Field | What to look at | Platform |
| --- | --- | --- | --- |
| Gentler Streak | Fitness | Apple Design Award 2024 winner. Calm tone, rest without guilt, soft charts | iOS |
| Tide Guide | Tides | Apple Design Award 2026, Visuals and Graphics: animated hour-by-hour charts | iOS |
| Bevel | Health | Morning scores in one dashboard (recovery, sleep, strain, stress, nutrition) | iOS only |
| Lifesum | Nutrition | Called "the prettiest" nutrition app in a June 2026 comparison (written by a competitor) | iOS, Android |
| Foodnoms | Nutrition | Apple-native SwiftUI interface, praised in the same comparison | iOS |
| Structured | Planner | Apple Design Award 2026 finalist (Inclusivity): timeline and colour per task | — |

Most of these are iOS-only: study them through Mobbin, App Store screenshots or videos.

## What makes an app look expensive (checklist for the new direction)

1. One accent colour, used sparingly; neutrals do most of the work
2. Large, confident numbers with tabular figures; a strict type scale
3. Generous whitespace and one spacing scale everywhere
4. Depth from materials and subtle layering, not heavy shadows
5. A single custom icon family; no emojis as icons
6. Thin, clean charts with motion that explains a change
7. Spring animations and haptics on every confirm
8. A dark mode designed on purpose, not inverted
9. Empty, loading and error states as polished as the full state

## Platform notes

- **SF Pro cannot ship on Android:** Apple fonts are for Apple platforms and must not be bundled. The new direction
  needs a licensed font with a similar feel
- **Glass effects on Android** need Android 13+ (API 33), the New Architecture and a development build with current
  libraries (e.g. `react-native-liquid-glass`, small and young). Plan a frosted fallback (`expo-blur`)
- The owner dislikes orange (vault note, 2026-10-22): the cocona accent is up for replacement

## Next step

Build three directions as clickable prototypes of the Today screen (same content, same signature elements),
in `explorations/`:

| # | Direction | Mood |
| --- | --- | --- |
| D1 | Light glass | Off-white, translucent cards, one deep green accent, thin custom icons |
| D2 | Night premium | Near-black layers, huge numbers, thin glowing charts, one mint accent |
| D3 | Warm editorial | Soft cream, serif titles, lots of air, pastel accents |

The owner picks one (or mixes), then `direction.md` and `tokens.md` are rewritten and one screen ships as proof.
