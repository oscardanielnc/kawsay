# 0029. Food labels read from a photo by Gemini, confirmed by the user

- Status: Accepted
- Date: 2026-11-12

## Context

The owner wants the exact supermarket products he eats (F23 piece 3). Typing a label is slow; a photo is not. DeepSeek
(ADR 0007) reads no images. Open Food Facts stays discarded (ADR 0014). A photo needs the camera: a native module.

## Options considered

- Type the label only: no AI, no new APK, but 11 numbers by hand per product
- On-device OCR (ML Kit): offline, but tables are columns (per 100 g / per serving) that OCR text loses
- **Vision model on the API:** Gemini Flash-Lite reads the table into the contract's JSON; cheap (≈ USD 0.0002 a label)

## Decision

- `POST /v1/catalog/label` takes one JPEG (≤ 1,600 px, ≤ 1.5 MB base64, nothing else) and answers `LabelReading`:
  numbers as printed per 100 g or per serving, `null` where the label shows nothing. Port `LabelReader`, adapter
  `GeminiLabelReader` (`gemini-3.5-flash-lite`, temperature 0, JSON output, Zod-validated)
- Checks in `ReadLabelUseCase`: energy present, serving grams for per-serving values, parts ≤ totals, energy within
  35 % of Atwater (`@kawsay/core/food/label-per-100g`); one corrected retry; a reading still failing is returned for
  the user to fix. 30 readings a day per user
- The phone always shows the form with every number editable, warns on an energy gap > 20 %, and saves nothing
  until the user confirms. The photo is never stored, here or on the server; logs carry tokens and latency only
- Label foods are a synced table `user_food` (per 100 g, serving, package, `labelDate`, `readByAi`) and rank first in
  search; the detail says "Etiqueta del envase · <date>"
- Camera: `expo-image-picker` + `expo-image-manipulator` → app version 0.2.0, a new APK (ADR 0010)

## Consequences

- Without signal or account the form still works by typing; reading needs the API and `GEMINI_API_KEY` on the VM
- A label is not health data, but its photo leaves the phone to Google: only the cropped table should be in frame
- Live check 2026-11-12 on an invented label: 11 of 11 numbers exact, flour detected, added sugar left null, 4 s
