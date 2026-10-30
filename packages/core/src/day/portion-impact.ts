import type { Tone } from '../shared/tone';
import { addedSugarLimits, addedSugarState } from './added-sugar';
import { greenRange, rangeState, type Metric } from './range-state';
import { refinedFlourLimits, refinedFlourState } from './refined-flour';

export type ImpactGauge = 'calories' | 'protein' | 'fat' | 'carbs' | 'addedSugar' | 'refinedFlour';
export const IMPACT_GAUGES: readonly ImpactGauge[] = [
  'calories',
  'protein',
  'fat',
  'carbs',
  'addedSugar',
  'refinedFlour',
];

/** The day's amounts, or what one portion adds, in the units of the gauges. */
export interface GaugeAmounts {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  addedSugarG: number;
  refinedFlourG: number;
}

export interface GaugeImpact {
  now: number;
  after: number;
  delta: number;
  zoneNow: Tone;
  zoneAfter: Tone;
  /** How far above its range the value sits: 0 in range or below, 1 a little over, 2 far over. */
  overNow: 0 | 1 | 2;
  overAfter: 0 | 1 | 2;
}

/** ADR 0020: a portion with more added sugar than this is "Mucho azúcar para una comida" (US DGA 2025–2030). */
export const SUGAR_PER_PORTION_G = 10;

const AMOUNT: Record<ImpactGauge, keyof GaugeAmounts> = {
  calories: 'kcal',
  protein: 'proteinG',
  fat: 'fatG',
  carbs: 'carbsG',
  addedSugar: 'addedSugarG',
  refinedFlour: 'refinedFlourG',
};
const MACRO: Partial<Record<ImpactGauge, { metric: Metric; target: keyof Targets }>> = {
  calories: { metric: 'calories', target: 'targetKcal' },
  protein: { metric: 'protein', target: 'proteinG' },
  fat: { metric: 'fat', target: 'fatG' },
  carbs: { metric: 'carbs', target: 'carbsG' },
};

interface Targets {
  targetKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

const OVER: Record<Tone, 0 | 1 | 2> = { green: 0, yellow: 1, red: 2 };

/**
 * How a portion would move the six gauges of the day (F05 "Portion impact preview", ADR 0020): for each gauge the
 * value now and after, its zone before and after, and the alerts: every gauge pushed further over its range, and
 * "too much sugar for one meal" when the portion adds more than 10 g of added sugar. Zones read as a closed day,
 * so filling a gauge up to its range is never an alert.
 */
export function portionImpact({
  targets,
  eaten,
  portion,
  refinedFlourShare,
}: {
  targets: Targets;
  eaten: GaugeAmounts;
  portion: GaugeAmounts;
  refinedFlourShare?: number;
}): {
  gauges: Record<ImpactGauge, GaugeImpact>;
  alerts: ImpactGauge[];
  sugarHeavy: boolean;
} {
  const sugar = addedSugarLimits(targets.targetKcal);
  const flour = refinedFlourLimits(targets.carbsG, refinedFlourShare);
  const zone = (gauge: ImpactGauge, value: number): { tone: Tone; over: 0 | 1 | 2 } => {
    const macro = MACRO[gauge];
    if (macro) {
      const target = targets[macro.target];
      const tone = rangeState({ metric: macro.metric, value, target, dayOpen: false }) as Tone;
      const above = value > greenRange(macro.metric, target).to;
      return { tone, over: above ? OVER[tone] : 0 };
    }
    const tone =
      gauge === 'addedSugar' ? addedSugarState(value, sugar) : refinedFlourState(value, flour);
    return { tone, over: OVER[tone] };
  };
  const gauges = {} as Record<ImpactGauge, GaugeImpact>;
  for (const gauge of IMPACT_GAUGES) {
    const now = eaten[AMOUNT[gauge]];
    const delta = portion[AMOUNT[gauge]];
    const after = now + delta;
    const before = zone(gauge, now);
    const then = zone(gauge, after);
    gauges[gauge] = {
      now,
      after,
      delta,
      zoneNow: before.tone,
      zoneAfter: then.tone,
      overNow: before.over,
      overAfter: then.over,
    };
  }
  return {
    gauges,
    alerts: IMPACT_GAUGES.filter((g) => gauges[g].overAfter > gauges[g].overNow),
    sugarHeavy: portion.addedSugarG > SUGAR_PER_PORTION_G,
  };
}
