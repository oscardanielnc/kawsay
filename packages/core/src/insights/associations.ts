import { dayNumber, type LocalDate } from '../shared/local-date';
import { benjaminiHochberg } from './false-discovery';
import { fisherExactP } from './fisher-exact';

/** One day: what happened (`food:…`, `tag:…`) and which symptoms were bad, among those answered. */
export interface AssociationDay {
  date: LocalDate;
  exposures: readonly string[];
  /** Symptom → bad that day. A symptom not answered that day is absent. */
  symptoms: Readonly<Record<string, boolean>>;
}

export type Confidence = 'low' | 'medium' | 'high';

export interface Association {
  exposure: string;
  symptom: string;
  direction: 'raises' | 'lowers';
  /** Days the exposure happened. */
  occurrences: number;
  /** Days with the symptom answered within 48 h after the exposure, and how many were bad. */
  exposedDays: number;
  exposedBad: number;
  /** Days with the symptom answered and no exposure in the 48 h before. */
  baselineDays: number;
  baselineBad: number;
  exposedRate: number;
  baselineRate: number;
  /** Fisher exact test: chance of a split this uneven with no relation at all. */
  pValue: number;
  /** p corrected for every pair tested (Benjamini–Hochberg). */
  qValue: number;
  confidence: Confidence;
}

const MIN_DAYS = 10;
/** Five, not three: fewer exposures line up with a symptom by chance too often (owner, 2026-11-04). */
const MIN_OCCURRENCES = 5;
/** Same day and up to 48 h later. */
const WINDOW_DAYS = 2;
/** A relation needs a clear gap: 25 points of rate and at least twice (or half) the baseline. */
const MIN_GAP = 0.25;
const MIN_RATIO = 2;
/**
 * At most about one coincidence in ten shown relations (owner, 2026-11-07: real use showed fruit-and-symptom
 * coincidences). Hundreds of foods are tested at once; without the correction a few always line up.
 */
const MAX_Q = 0.1;

function confidence(occurrences: number, exposedDays: number, qValue: number): Confidence {
  if (occurrences >= 8 && exposedDays >= 8 && qValue <= 0.01) return 'high';
  if (occurrences >= 5 && exposedDays >= 5 && qValue <= 0.05) return 'medium';
  return 'low';
}

/**
 * What lines up with the user's symptoms (F17): for each exposure and symptom, how often the symptom is bad within
 * 48 h after the exposure vs on days without it, against the user's own baseline. A relation needs a clear gap and
 * must survive a Fisher test corrected for every pair tested. Pure counting; the AI only words the result.
 */
export function findAssociations(
  days: readonly AssociationDay[],
  /** Pairs worth comparing (`relation-pairs.ts`); every pair when absent. */
  mayRelate: (exposure: string, symptom: string) => boolean = () => true,
):
  | { status: 'need-days'; loggedDays: number; neededDays: number }
  | { status: 'ok'; loggedDays: number; findings: Association[] } {
  const logged = days.filter((d) => Object.keys(d.symptoms).length > 0);
  if (logged.length < MIN_DAYS)
    return { status: 'need-days', loggedDays: logged.length, neededDays: MIN_DAYS };

  const exposureDays = new Map<string, Set<number>>();
  for (const d of days) {
    const n = dayNumber(d.date);
    for (const e of new Set(d.exposures)) {
      if (!exposureDays.has(e)) exposureDays.set(e, new Set());
      exposureDays.get(e)!.add(n);
    }
  }
  const symptoms = [...new Set(logged.flatMap((d) => Object.keys(d.symptoms)))];

  const tested: Omit<Association, 'qValue' | 'confidence'>[] = [];
  for (const [exposure, on] of exposureDays) {
    if (on.size < MIN_OCCURRENCES) continue;
    for (const symptom of symptoms) {
      if (!mayRelate(exposure, symptom)) continue;
      let [exposedDays, exposedBad, baselineDays, baselineBad] = [0, 0, 0, 0];
      for (const d of logged) {
        const bad = d.symptoms[symptom];
        if (bad === undefined) continue;
        const n = dayNumber(d.date);
        const exposed = Array.from({ length: WINDOW_DAYS + 1 }, (_, k) => on.has(n - k)).some(
          Boolean,
        );
        if (exposed) [exposedDays, exposedBad] = [exposedDays + 1, exposedBad + Number(bad)];
        else [baselineDays, baselineBad] = [baselineDays + 1, baselineBad + Number(bad)];
      }
      if (exposedDays < MIN_OCCURRENCES || baselineDays < MIN_OCCURRENCES) continue;
      const exposedRate = exposedBad / exposedDays;
      const baselineRate = baselineBad / baselineDays;
      tested.push({
        exposure,
        symptom,
        occurrences: on.size,
        exposedDays,
        exposedBad,
        baselineDays,
        baselineBad,
        exposedRate,
        baselineRate,
        direction: exposedRate > baselineRate ? 'raises' : 'lowers',
        pValue: fisherExactP(
          exposedBad,
          exposedDays - exposedBad,
          baselineBad,
          baselineDays - baselineBad,
        ),
      });
    }
  }
  // Every pair tested counts in the correction, also those that end up with no visible gap.
  const qValues = benjaminiHochberg(tested.map((t) => t.pValue));
  const findings: Association[] = tested.flatMap((t, i) => {
    const qValue = qValues[i]!;
    const gap = Math.abs(t.exposedRate - t.baselineRate);
    const [high, low] =
      t.direction === 'raises' ? [t.exposedRate, t.baselineRate] : [t.baselineRate, t.exposedRate];
    if (gap < MIN_GAP || high < MIN_RATIO * low || qValue > MAX_Q) return [];
    return [{ ...t, qValue, confidence: confidence(t.occurrences, t.exposedDays, qValue) }];
  });
  const rank: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };
  findings.sort(
    (a, b) =>
      rank[a.confidence] - rank[b.confidence] ||
      Math.abs(b.exposedRate - b.baselineRate) - Math.abs(a.exposedRate - a.baselineRate),
  );
  return { status: 'ok', loggedDays: logged.length, findings };
}
