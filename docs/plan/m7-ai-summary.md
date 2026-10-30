# M7. AI summary on demand

Goal: the AI analysis becomes short, tagged and only on demand (F17 redesign).

## Read

- F17, ADR 0007, 0019; `packages/contracts/src/insights.ts`; API `modules/insights`; mobile `features/insights`;
  `Analysis.dc.html` ("Resumen con IA")

## Steps

1. **Contract v2:** summary ≤ 220 · findings ≤ 3 `{ tag: food|sleep|stress|activity|symptom, title ≤ 60, detail ≤ 140,
   confidence: low|medium|high }` · habits ≤ 2 (≤ 80) · warningSigns ≤ 3, empty when none. ~1,500 characters max.
   Keep v1 answering until the app update ships (versioned endpoint or field); record the choice in an ADR
2. **Prompt:** Spanish, short, only these fields; invalid output retried once (as today). Tests with a fake `AiPort`
3. **When to suggest an update:** `packages/core` `insights/should-suggest-update`: ≥ 7 days since the last one, or
   ≥ 4 new logged days, or a new symptom episode. Tests
4. **Card:** last update date, suggestion banner (peach) or "Al día" (blue), the only AI trigger is "Actualizar
   resumen", busy state, "quedan n de 3 hoy", findings with coloured tags and three confidence dots, "Prueba esto"
   chips, warning signs only when present, "No es un diagnóstico". Never calls the AI on open
5. The limit stays 3 per rolling 24 h

## Done when

- [x] F17 criteria pass with v2; a test proves opening Insights makes no AI call
- [x] API ready (ADR 0022: `POST /v1/insights/summary`, `/analyze` kept); deployed to dev 2026-10-30
