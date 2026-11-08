# 0020. Liver-health targets

- Status: Accepted (owner, 2026-10-30)
- Date: 2026-10-30

## Context

Goal: habits behind fatty liver (MASLD, ~36% of adults in South America, ALEH 2025), sugar first. Drivers: added sugar,
above all fructose in drinks (80 g/day doubled liver fat production in 7 weeks, Geidl-Flueck, J Hepatol 2021), excess
calories and belly fat, alcohol, inactivity, short sleep. Refined flours drive overeating, not liver fat (F24).

## Options considered

- Keep the targets: sugar was capped (F22), but drinks, strength, alcohol and sleep had no target
- A sugar cap below WHO's 5% (e.g. 15 g): no guideline gives a lower number. Discarded
- **Guideline targets in one table, blue · amber · coral, computed on the phone**: chosen

## Decision

| Target | Blue | Amber | Coral | Source |
| --- | --- | --- | --- | --- |
| Added sugar, day | ≤ 5% of target kcal | ≤ 10% | > 10% | WHO 2015 (as F22) |
| Added sugar, one portion | ≤ 10 g | > 10 g: chip only | — | US DGA 2025–2030 |
| Sugary drinks, week | 0 | 1–2 | ≥ 3 | EASL-EASD-EASO 2024 (avoid); bands: product choice |
| Movement minutes, week | ≥ 150 (300 "ideal") | 75–149 | < 75 | WHO 2020 |
| Strength days, week | ≥ 2 | 1 | 0 | WHO 2020 |
| Alcohol, week | 0 g | 1–209 g | ≥ 210 g (women 140) | MASLD nomenclature 2023 (MetALD) |
| Sleep, week average | 7–9 h | 6–7 · 9–10 h | < 6 · > 10 h | National Sleep Foundation 2015 |
| Waist-to-height | < 0.50 | 0.50–0.59 | ≥ 0.60 | NICE 2022 (as F04) |
| Weight goal, BMI ≥ 25 | suggest −7% to −10% | | | EASL-EASD-EASO 2024 |

- Sugary drink: a logged drink (group `drink`, served by "vaso", or tapped in hydration) with ≥ 5 g added sugar
- Movement: MET ≥ 3.0 counts, MET ≥ 6.0 counts double (WHO: 75 vigorous = 150 moderate); base day never; 30 min/day
- Strength day: weights, bodyweight or circuit work (F08, F18) · Alcohol g = ml × ABV ÷ 100 × 0.789 (F10)
- FIB-4 = age × AST ÷ (platelets 10⁹/L × √ALT): < 1.30 low · 1.30–2.67 see a doctor · > 2.67 high (> 65 y: low < 2.0)

## Consequences

- One pure function per rule in `packages/core`, tested with these numbers; nothing new reaches the AI; coffee is not
  penalised. Kawsay never diagnoses: every liver screen says so and points to a doctor
