import { addedSugarLimits, addedSugarState } from '@kawsay/core/day/added-sugar';
import type { ContributionMetric } from '@kawsay/core/day/contributions';
import { greenRange, RANGE_ZONES, rangeState, type Metric } from '@kawsay/core/day/range-state';
import { refinedFlourLimits, refinedFlourState } from '@kawsay/core/day/refined-flour';
import {
  gaugePosition,
  oneSidedScale,
  twoSidedScale,
  type GaugeScale,
} from '@kawsay/core/gauge/scale';
import type { TFunction } from 'i18next';
import type { PillTone } from '@/components/data-display/Pill';
import { formatNumber } from '@/lib/format';

export interface DayTargetsShown {
  targetKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}
export interface DayEaten {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  addedSugarG: number;
  refinedFlourG: number;
}

export type GaugeKey = 'calories' | 'protein' | 'fat' | 'carbs' | 'sugar' | 'flour';
export const GAUGE_KEYS: readonly GaugeKey[] = [
  'calories',
  'protein',
  'fat',
  'carbs',
  'sugar',
  'flour',
];

/** Everything a gauge shows, on Today and in its detail sheet (F26). */
export interface GaugeReading {
  key: GaugeKey;
  name: string;
  /** What the day's entries carry for this gauge. */
  metric: ContributionMetric;
  scale: GaugeScale;
  /** Null hides the needle (nothing logged yet on a two-sided gauge). */
  position: number | null;
  overflow: boolean;
  amount: number;
  value: string;
  unit: string;
  state: string;
  tone: PillTone;
  /** The short range line under a Today card. */
  range: string;
  /** The detail line: target and blue range, or the limit. */
  meta: string;
  /** The limits between two zones, in the gauge's unit. */
  limits: number[];
}

const MACROS: readonly {
  key: GaugeKey & Metric;
  target: keyof DayTargetsShown;
  eaten: ContributionMetric;
  unit: string;
}[] = [
  { key: 'calories', target: 'targetKcal', eaten: 'kcal', unit: 'kcal' },
  { key: 'protein', target: 'proteinG', eaten: 'proteinG', unit: 'g' },
  { key: 'fat', target: 'fatG', eaten: 'fatG', unit: 'g' },
  { key: 'carbs', target: 'carbsG', eaten: 'carbsG', unit: 'g' },
];

const TONE_PILL = { green: 'in', yellow: 'near', red: 'far' } as const satisfies Record<
  string,
  PillTone
>;

const limitsOf = (scale: GaugeScale) =>
  scale.zones.slice(1).map((z) => scale.min + z.from * (scale.max - scale.min));
const unitSuffix = (unit: string) => (unit === 'kcal' ? '' : ` ${unit}`);

/**
 * The six gauges of a day: calories, protein, fat and carbohydrates two-sided around their range; added sugar (F22)
 * and refined flours (F24) one-sided under a ceiling. Zones at real scale (ADR 0027).
 */
export function gaugeReadings({
  targets,
  eaten,
  dayOpen,
  refinedFlourShare,
  t,
}: {
  targets: DayTargetsShown;
  eaten: DayEaten;
  dayOpen: boolean;
  refinedFlourShare: number | null;
  t: TFunction;
}): GaugeReading[] {
  const readings: GaugeReading[] = MACROS.map(
    ({ key, target: targetKey, eaten: eatenKey, unit }) => {
      const target = targets[targetKey];
      const value = eaten[eatenKey];
      const green = greenRange(key, target);
      const state = rangeState({ metric: key, value, target, dayOpen });
      const below = value < green.from;
      let label = `✓ ${t('ranges.inRange')}`;
      let tone: PillTone = 'in';
      if (value === 0) [label, tone] = [t('ranges.none'), 'neutral'];
      else if (state === 'left')
        [label, tone] = [
          t('ranges.leftOpen', { amount: formatNumber(green.from - value) }),
          'neutral',
        ];
      else if (state !== 'green') {
        const word = state === 'yellow' ? (below ? 'lowish' : 'highish') : below ? 'low' : 'high';
        [label, tone] = [`${below ? '↓' : '↑'} ${t(`ranges.${word}`)}`, TONE_PILL[state]];
      }
      const scale = twoSidedScale(target, RANGE_ZONES[key]);
      const at = gaugePosition(scale, value);
      return {
        key,
        name: t(`ranges.${key}`),
        metric: eatenKey,
        scale,
        position: value > 0 ? at.position : null,
        overflow: at.overflow,
        amount: value,
        value: formatNumber(value),
        unit,
        state: label,
        tone,
        range: t('ranges.range', {
          from: formatNumber(green.from),
          to: formatNumber(green.to),
          unit: unitSuffix(unit),
        }),
        meta: t('gaugeDetail.metaTwoSided', {
          target: formatNumber(target),
          from: formatNumber(green.from),
          to: formatNumber(green.to),
          unit,
        }),
        limits: limitsOf(scale),
      };
    },
  );

  const sugar = addedSugarLimits(targets.targetKcal);
  const sugarTone = addedSugarState(eaten.addedSugarG, sugar);
  const sugarScale = oneSidedScale(sugar.greenMaxG, sugar.yellowMaxG);
  readings.push({
    key: 'sugar',
    name: t('sugar.title'),
    metric: 'addedSugarG',
    scale: sugarScale,
    ...gaugePosition(sugarScale, eaten.addedSugarG),
    amount: eaten.addedSugarG,
    value: formatNumber(eaten.addedSugarG),
    unit: 'g',
    state: eaten.addedSugarG === 0 ? t('sugar.none') : t(`sugar.states.${sugarTone}`),
    tone: TONE_PILL[sugarTone],
    range: t('sugar.range', {
      green: formatNumber(sugar.greenMaxG),
      max: formatNumber(sugar.yellowMaxG),
    }),
    meta: t('gaugeDetail.metaSugar', { limit: formatNumber(sugar.greenMaxG) }),
    limits: limitsOf(sugarScale),
  });

  const flour = refinedFlourLimits(targets.carbsG, refinedFlourShare ?? undefined);
  const flourTone = refinedFlourState(eaten.refinedFlourG, flour);
  const flourScale = oneSidedScale(flour.limitG, flour.maxG);
  readings.push({
    key: 'flour',
    name: t('flour.title'),
    metric: 'refinedFlourG',
    scale: flourScale,
    ...gaugePosition(flourScale, eaten.refinedFlourG),
    amount: eaten.refinedFlourG,
    value: formatNumber(eaten.refinedFlourG),
    unit: 'g',
    state: eaten.refinedFlourG === 0 ? t('flour.none') : t(`flour.states.${flourTone}`),
    tone: TONE_PILL[flourTone],
    range: t('flour.range', { limit: formatNumber(flour.limitG) }),
    meta: t('gaugeDetail.metaFlour', { limit: formatNumber(flour.limitG) }),
    limits: limitsOf(flourScale),
  });
  return readings;
}
