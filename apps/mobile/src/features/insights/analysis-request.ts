import type { AnalysisRequest } from '@kawsay/contracts/insights';
import type { TFunction } from 'i18next';
import type { Exposure, InsightsData, Relation } from './types';

/** Labels without their leading emoji or arrow: the AI reads words. */
const plain = (text: string) => text.replace(/^[^\p{L}\p{N}]+/u, '').trim();

/**
 * What the phone sends for an AI analysis (F17, ADR 0019): the relations it counted, in Spanish words, the week, the
 * nutrients below their reference and the day notes as written. Nothing else leaves the phone.
 */
export function buildAnalysisRequest(data: InsightsData, t: TFunction): AnalysisRequest {
  const exposure = (e: Exposure) =>
    e.kind === 'tag' ? plain(t(`insights.relations.tags.${e.id}`)) : e.name;
  const effect = (r: Relation) =>
    plain(
      r.symptom.kind === 'own'
        ? t(`insights.relations.effect.own.${r.direction}`, { name: r.symptom.name.toLowerCase() })
        : t(`insights.relations.effect.${r.symptom.id}.${r.direction}`),
    );
  const findings =
    data.relations.status === 'ok'
      ? data.relations.findings.map((r) => ({
          exposure: exposure(r.exposure),
          effect: effect(r),
          exposedBad: r.exposedBad,
          exposedDays: r.exposedDays,
          baselineBad: r.baselineBad,
          baselineDays: r.baselineDays,
          confidence: r.confidence,
        }))
      : [];
  const low =
    data.nutrients?.status === 'ok'
      ? data.nutrients.rows
          .filter((row) => row.tone === 'red' || row.tone === 'yellow')
          .filter((row) => row.key !== 'sodiumMg')
          .map((row) => ({
            name: t(`insights.nutrients.names.${row.key}`),
            percent: Math.round(row.percent),
          }))
      : [];
  return {
    period: { from: data.relationsFrom, to: data.to, loggedDays: data.relations.loggedDays },
    findings: findings.slice(0, 20),
    week: {
      green: data.week.days.green,
      yellow: data.week.days.yellow,
      red: data.week.days.red,
      movementMinutes: data.week.movement.minutes,
      lowNutrients: low,
    },
    notes: data.notes.slice(-200),
  };
}
