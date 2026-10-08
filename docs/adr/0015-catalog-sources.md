# 0015. Catalog source files: INS 2023 extracted from the PDF, USDA SR Legacy

- Status: Accepted
- Date: 2026-10-07

## Context

ADR 0014 names INS and USDA as nutrient sources. INS publishes only a PDF (no spreadsheet); USDA publishes CSV
releases of several datasets.

## Options considered

- INS: type values by hand (error-prone) · scrape the TPCA mobile app (terms unclear) · **extract the PDF by
  word position** (every value lands in the column under its unit label)
- USDA: Foundation Foods (few hundred foods, newest analyses) · **SR Legacy** (7,793 foods, B12 and vitamin D for
  almost all, frozen 2018) · FDC API (needs a key, network at build time)

## Decision

- `packages/catalog/sources/` holds both tables as CSV with the same column names, plus the scripts that produce
  them and the download URL and SHA-256 of each original
- INS: 1,125 foods (groups A–U) extracted with `pdfplumber`; "•" stays empty; asterisk marks become
  `imputed_from`. Group S (567 preparations by stratum) goes to its own file for cross-checks
- USDA: SR Legacy, slimmed to the 22 columns Kawsay uses

## Consequences

- Python is needed only to regenerate the sources, never to build or run the app
- Licence: the INS repository tags the file CC BY-NC-ND, but the document's credits page authorises total or
  partial reproduction citing the source; the "About the data" screen cites it. Re-check before a commercial release
- Values are reproducible: any row traces to a PDF page or an FDC id
