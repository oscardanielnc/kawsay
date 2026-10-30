# Architecture Decision Records

One decision per file (`NNNN-slug.md`, max 40 lines). Discarded attempts are recorded too, so nobody tries them again.
Template: [template.md](template.md).

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-monorepo.md) | Monorepo: Expo app, NestJS API and shared core | Accepted |
| [0002](0002-mobile-stack.md) | Mobile stack: Expo SDK 57 + React Native | Accepted |
| [0003](0003-module-architecture.md) | Hexagonal API modules, feature folders on mobile | Accepted |
| [0004](0004-offline-first-sync.md) | Offline-first: SQLite on device, push/pull sync | Accepted |
| [0005](0005-mobile-auth.md) | Mobile authentication: secure-store refresh token | Accepted |
| [0006](0006-i18n-spanish-ui.md) | Spanish UI through i18n from day one | Accepted |
| [0007](0007-ai-gateway.md) | AI behind a port, DeepSeek as first adapter | Accepted |
| [0008](0008-ai-picks-table-computes.md) | AI picks, the table computes | Accepted |
| [0009](0009-targets-algorithm.md) | Daily targets and recalibration | Accepted |
| [0010](0010-builds-and-updates.md) | Two app variants, development builds and over-the-air updates | Accepted |
| [0011](0011-deployment.md) | API on the Oracle VM with Docker Compose | Accepted |
| [0012](0012-toolchain-and-tests.md) | Toolchain versions and mobile test runner | Accepted |
| [0013](0013-sensitive-data.md) | Sensitive data handling | Accepted |
| [0014](0014-food-data.md) | Food data: three layers and household units | Accepted |
| [0015](0015-catalog-sources.md) | Catalog source files: INS 2023 from the PDF, USDA SR Legacy | Accepted |
| [0016](0016-local-dates.md) | Days are local calendar days from the phone's time zone | Accepted |
| [0017](0017-mobile-compose-layer.md) | A compose layer for what spans features on mobile | Accepted |
| [0018](0018-sync-storage-and-change-tracking.md) | Sync storage on the server, change tracking on the phone | Accepted |
| [0019](0019-insights-on-phone-notes-to-ai.md) | Insights computed on the phone; day notes go to the AI as text | Accepted |
| [0020](0020-liver-health-targets.md) | Liver-health targets: sugar, drinks, movement, alcohol, sleep | Accepted |
| [0021](0021-every-ins-food-on-the-phone.md) | Every INS food on the phone; USDA stays a source, not a list | Accepted |
| [0022](0022-ai-summary-endpoint.md) | The short AI summary is a new endpoint; the old analysis keeps answering | Accepted |
