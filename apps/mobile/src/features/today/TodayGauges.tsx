import { addedSugarLimits, addedSugarState } from '@kawsay/core/day/added-sugar';
import { greenRange, RANGE_ZONES, rangeState, type Metric } from '@kawsay/core/day/range-state';
import { refinedFlourLimits, refinedFlourState } from '@kawsay/core/day/refined-flour';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Pill, type PillTone } from '@/components/data-display/Pill';
import {
  oneSidedPosition,
  twoSidedPosition,
  type GaugeKind,
} from '@/components/data-display/gauge-zones';
import { ZoneGauge } from '@/components/data-display/ZoneGauge';
import { formatNumber } from '@/lib/format';
import { color, radius, shadow, space, type } from '@/lib/theme';

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

interface Props {
  targets: DayTargetsShown;
  eaten: DayEaten;
  /** Today is open: calories below range read grey "N left · the day goes on" (design). */
  dayOpen: boolean;
  /** Personal refined-flour limit, share of the carbohydrate target (F24); null = default. */
  refinedFlourShare?: number | null;
}

const MACROS: readonly {
  metric: Metric;
  target: keyof DayTargetsShown;
  eaten: 'kcal' | 'proteinG' | 'fatG' | 'carbsG';
  unit: string;
}[] = [
  { metric: 'calories', target: 'targetKcal', eaten: 'kcal', unit: 'kcal' },
  { metric: 'protein', target: 'proteinG', eaten: 'proteinG', unit: 'g' },
  { metric: 'fat', target: 'fatG', eaten: 'fatG', unit: 'g' },
  { metric: 'carbs', target: 'carbsG', eaten: 'carbsG', unit: 'g' },
];

const TONE_PILL = { green: 'in', yellow: 'near', red: 'far' } as const satisfies Record<
  string,
  PillTone
>;

interface Shown {
  key: string;
  name: string;
  kind: GaugeKind;
  position: number | null;
  value: string;
  unit: string;
  state: string;
  tone: PillTone;
  range: string;
}

/** One gauge card: name, arc with its needle, the amount, the state pill and the range under it. */
const GaugeCard = memo(function GaugeCard({ gauge }: { gauge: Shown }) {
  return (
    <View style={styles.card}>
      <Text style={[type.label, styles.name]} numberOfLines={1}>
        {gauge.name}
      </Text>
      <ZoneGauge
        kind={gauge.kind}
        position={gauge.position}
        value={gauge.value}
        unit={gauge.unit}
        accessibilityLabel={`${gauge.name}: ${gauge.value} ${gauge.unit}, ${gauge.state}. ${gauge.range}`}
      />
      <View style={styles.pill}>
        <Pill tone={gauge.tone} text={gauge.state} />
      </View>
      <Text style={[type.caption, styles.range]} numberOfLines={1}>
        {gauge.range}
      </Text>
    </View>
  );
});

/**
 * The day in six gauges (Amanecer, Main.dc.html): calories, protein, fat and carbohydrates two-sided around their
 * range; added sugar (F22) and refined flours (F24) one-sided under a ceiling. Blue in range, amber near, coral far.
 */
export function TodayGauges({ targets, eaten, dayOpen, refinedFlourShare = null }: Props) {
  const { t } = useTranslation();
  const gauges: Shown[] = MACROS.map(({ metric, target: targetKey, eaten: eatenKey, unit }) => {
    const target = targets[targetKey];
    const value = eaten[eatenKey];
    const green = greenRange(metric, target);
    const state = rangeState({ metric, value, target, dayOpen });
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
    return {
      key: metric,
      name: t(`ranges.${metric}`),
      kind: 'two-sided',
      position: value > 0 ? twoSidedPosition((value / target) * 100, RANGE_ZONES[metric]) : null,
      value: formatNumber(value),
      unit,
      state: label,
      tone,
      range: t('ranges.range', {
        from: formatNumber(green.from),
        to: formatNumber(green.to),
        unit: unit === 'kcal' ? '' : ` ${unit}`,
      }),
    };
  });

  const sugar = addedSugarLimits(targets.targetKcal);
  const sugarTone = addedSugarState(eaten.addedSugarG, sugar);
  gauges.push({
    key: 'sugar',
    name: t('sugar.title'),
    kind: 'one-sided',
    position: oneSidedPosition(eaten.addedSugarG, sugar.greenMaxG, sugar.yellowMaxG),
    value: formatNumber(eaten.addedSugarG),
    unit: 'g',
    state: eaten.addedSugarG === 0 ? t('sugar.none') : t(`sugar.states.${sugarTone}`),
    tone: TONE_PILL[sugarTone],
    range: t('sugar.range', {
      green: formatNumber(sugar.greenMaxG),
      max: formatNumber(sugar.yellowMaxG),
    }),
  });

  const flour = refinedFlourLimits(targets.carbsG, refinedFlourShare ?? undefined);
  const flourTone = refinedFlourState(eaten.refinedFlourG, flour);
  gauges.push({
    key: 'flour',
    name: t('flour.title'),
    kind: 'one-sided',
    position: oneSidedPosition(eaten.refinedFlourG, flour.limitG, flour.maxG),
    value: formatNumber(eaten.refinedFlourG),
    unit: 'g',
    state: eaten.refinedFlourG === 0 ? t('flour.none') : t(`flour.states.${flourTone}`),
    tone: TONE_PILL[flourTone],
    range: t('flour.range', { limit: formatNumber(flour.limitG) }),
  });

  return (
    <View accessibilityLabel={t('ranges.title')} style={styles.grid}>
      {gauges.map((gauge) => (
        <GaugeCard key={gauge.key} gauge={gauge} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: space.md,
    paddingTop: space.md + 2,
    paddingBottom: space.md,
    gap: space.xs,
    alignItems: 'stretch',
    ...shadow,
  },
  name: { color: color.inkMuted, fontFamily: type.section.fontFamily },
  pill: { marginTop: space.sm + 2, alignItems: 'center' },
  range: { color: color.inkMuted, textAlign: 'center' },
});
