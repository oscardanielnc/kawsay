# @kawsay/core

Pure TypeScript rules shared by `apps/mobile` (offline) and `apps/api` (insights). Imports nothing.

| Import                              | Rule                                                                               | Source        |
| ----------------------------------- | ---------------------------------------------------------------------------------- | ------------- |
| `@kawsay/core/energy/bmr`           | `basalMetabolicRate`: Mifflin-St Jeor                                              | ADR 0009, F01 |
| `@kawsay/core/energy/activity`      | `activityKcal`, `dayActivityKcal`: (MET − 1) × BMR/24 × h × 1.10, baseline MET 1.4 | ADR 0009, F08 |
| `@kawsay/core/energy/routine`       | `exerciseEnergy`, `routineSessionEnergy`: time by exercise kind, Compendium codes  | F18           |
| `@kawsay/core/targets/day-target`   | `dayTarget`, `goalPace`: deficit with 1%/week and 25% caps, never below BMR        | ADR 0009, F01 |
| `@kawsay/core/targets/macros`       | `dayMacros`, `referenceWeightKg`                                                   | ADR 0009, F09 |
| `@kawsay/core/body/bmi`             | `bmiStatus`: WHO bands, kg to the green range                                      | F01           |
| `@kawsay/core/body/waist-to-height` | `waistToHeight`: NICE 2022 bands                                                   | F04           |

Invalid input (non-positive weight, a setting out of range) throws `RangeError`: screens validate first, so a
throw is a bug.

```sh
pnpm --filter @kawsay/core test        # once
pnpm --filter @kawsay/core test:watch  # TDD loop
```
