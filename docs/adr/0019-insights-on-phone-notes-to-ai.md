# 0019. Insights computed on the phone; day notes go to the AI as text

- Status: Accepted
- Date: 2026-10-12

## Context

F17 relates what the user eats and does to their symptoms. ADR 0007 sends the AI aggregates only. Day notes (F21)
are free text ("I think the ceviche gave me diarrhoea") that an aggregate cannot carry.

## Options considered

- a) Notes go to the AI as written, only when the user asks for an analysis — chosen by Oscar
- b) Notes go with people's names removed — names are hard to detect reliably in Spanish free text
- c) Notes never go to the AI — the analysis loses the user's own explanations

## Decision

- The relations are counted on the phone (`packages/core` `insights/associations`): days with X within 48 h vs days
  without X, minimum 10 logged days and 3 occurrences. Works offline and without AI
- The AI (F17, later) receives those aggregates **plus the text of the day notes of the analysed window**, only when
  the user taps "Analizar", and writes findings and habit suggestions
- Still never sent: intimate entries (ADR 0013), user identifiers

## Consequences

- The deterministic findings are shown before any AI exists, and the AI cannot invent a relation
- Notes reach the AI provider (DeepSeek stores data in China, ADR 0007): the consent screen before public release must
  say so
