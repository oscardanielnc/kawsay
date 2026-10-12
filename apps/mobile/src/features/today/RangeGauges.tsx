import { greenRange, RANGE_ZONES, rangeState, type Metric } from '@kawsay/core/day/range-state';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import { ArcGauge } from '@/components/data-display/ArcGauge';
import { TWO_SIDED } from '@/components/data-display/gauge';
import { TRACK_STOPS, trackPosition } from './range-scale';

interface Props {
  targets: { targetKcal: number; proteinG: number; fatG: number; carbsG: number };
  eaten: { kcal: number; proteinG: number; fatG: number; carbsG: number };
  /** Today is open: below green reads "N left" instead of a warning (design). */
  dayOpen: boolean;
}

const ROWS: readonly {
  metric: Metric;
  target: keyof Props['targets'];
  eaten: keyof Props['eaten'];
  unit: string;
}[] = [
  { metric: 'calories', target: 'targetKcal', eaten: 'kcal', unit: 'kcal' },
  { metric: 'protein', target: 'proteinG', eaten: 'proteinG', unit: 'g' },
  { metric: 'fat', target: 'fatG', eaten: 'fatG', unit: 'g' },
  { metric: 'carbs', target: 'carbsG', eaten: 'carbsG', unit: 'g' },
];

type Tone = 'none' | 'neutral' | 'green' | 'yellow' | 'red';
const TONE: Record<Tone, { text: string; pill: string }> = {
  none: { text: color.inkMuted, pill: color.bg },
  neutral: { text: color.inkMuted, pill: color.bg },
  green: { text: color.successText, pill: color.green50 },
  yellow: { text: color.warningText, pill: color.warning50 },
  red: { text: color.dangerText, pill: color.danger50 },
};

const LIMITS = ['yellowFrom', 'greenFrom', 'greenTo', 'yellowTo'] as const;

function Gauge({
  metric,
  value,
  target,
  unit,
  name,
  label,
  tone,
  hero,
}: {
  hero: boolean;
  metric: Metric;
  value: number;
  target: number;
  unit: string;
  name: string;
  label: string;
  tone: Tone;
}) {
  const { t } = useTranslation();
  const zone = RANGE_ZONES[metric];
  const green = greenRange(metric, target);
  const look = TONE[tone];
  return (
    <View style={[styles.card, hero && styles.hero]}>
      <Text style={[type.heading, styles.ink]} numberOfLines={1}>
        {name}
      </Text>
      <View style={hero && styles.heroArc}>
        <ArcGauge
          bands={TWO_SIDED}
          limits={LIMITS.map((limit) => ({
            at: TRACK_STOPS[limit],
            text: formatNumber((target * zone[limit]) / 100),
            strong: limit === 'greenFrom' || limit === 'greenTo',
          }))}
          needle={value > 0 ? trackPosition((value / target) * 100, zone) : null}
          value={formatNumber(value)}
          unit={unit}
          accessibilityLabel={t('ranges.track', {
            name,
            label,
            from: formatNumber(green.from),
            to: formatNumber(green.to),
            unit,
          })}
        />
      </View>
      <View style={[styles.pill, { backgroundColor: look.pill }]}>
        <Text style={[type.label, { color: look.text }]}>{label}</Text>
      </View>
    </View>
  );
}

/**
 * Calories and macros as speedometer-like gauges (design, 2026-10-12): pastel red · yellow · green blending softly,
 * the four zone limits outside the arc, the day's amount large in the middle, a slim needle and the state below.
 */
export function RangeGauges({ targets, eaten, dayOpen }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[type.label, styles.title]}>
        {t('ranges.title')}
      </Text>
      <View style={styles.grid}>
        {ROWS.map(({ metric, target: targetKey, eaten: eatenKey, unit }, index) => {
          const target = targets[targetKey];
          const value = eaten[eatenKey];
          const green = greenRange(metric, target);
          const state = rangeState({ metric, value, target, dayOpen });
          const below = value < green.from;
          let label = `✓ ${t('ranges.inRange')}`;
          let tone: Tone = 'green';
          if (value === 0) [label, tone] = [t('ranges.none'), 'none'];
          else if (state === 'left')
            [label, tone] = [
              t('ranges.left', { amount: formatNumber(green.from - value), unit }),
              'neutral',
            ];
          else if (state === 'yellow')
            [label, tone] = [
              `${below ? '↓' : '↑'} ${t(below ? 'ranges.lowish' : 'ranges.highish')}`,
              'yellow',
            ];
          else if (state === 'red')
            [label, tone] = [
              `${below ? '↓' : '↑'} ${t(below ? 'ranges.low' : 'ranges.high')}`,
              'red',
            ];
          return (
            <Gauge
              key={metric}
              hero={index === 0}
              metric={metric}
              value={value}
              target={target}
              unit={unit}
              name={t(`ranges.${metric}`)}
              label={label}
              tone={tone}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  title: { color: color.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm + 2 },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: color.surface,
    borderRadius: radius.card + 2,
    paddingHorizontal: space.sm + 2,
    paddingTop: space.md,
    paddingBottom: space.sm + 2,
    gap: space.xs,
    alignItems: 'stretch',
  },
  hero: { flexBasis: '100%' },
  heroArc: { paddingHorizontal: '8%' },
  pill: {
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
  },
  ink: { color: color.ink },
});
