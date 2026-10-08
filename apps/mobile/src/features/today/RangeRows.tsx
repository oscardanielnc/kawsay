import { greenRange, RANGE_ZONES, rangeState, type Metric } from '@kawsay/core/day/range-state';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';

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
/** The track shows 0–200 % of the target. */
const at = (percent: number) => `${Math.min(100, Math.max(0, percent / 2))}%` as const;

/** Calories and macros as ranges, not numbers to fill: value, state, track and the green limits (design). */
export function RangeRows({ targets, eaten, dayOpen }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.rows}>
      {ROWS.map(({ metric, target: targetKey, eaten: eatenKey, unit }) => {
        const target = targets[targetKey];
        const value = eaten[eatenKey];
        const zone = RANGE_ZONES[metric];
        const green = greenRange(metric, target);
        const state = rangeState({ metric, value, target, dayOpen });
        const below = value < green.from;
        let label = t('ranges.inRange');
        let tone: string = color.successText;
        if (value === 0) [label, tone] = [t('ranges.none'), color.inkMuted];
        else if (state === 'left')
          [label, tone] = [
            t('ranges.left', { amount: formatNumber(green.from - value), unit }),
            color.inkMuted,
          ];
        else if (state === 'yellow')
          [label, tone] = [t(below ? 'ranges.lowish' : 'ranges.highish'), color.warningText];
        else if (state === 'red')
          [label, tone] = [t(below ? 'ranges.low' : 'ranges.high'), color.dangerText];
        const name = t(`ranges.${metric}`);
        return (
          <View key={metric} style={styles.row}>
            <View style={styles.top}>
              <Text style={[type.heading, styles.ink, styles.grow]}>{name}</Text>
              <Text style={[type.label, styles.ink]}>{`${formatNumber(value)} ${unit}`}</Text>
              <Text style={[type.label, { color: tone }]}>{label}</Text>
            </View>
            <View
              accessible
              accessibilityLabel={t('ranges.track', {
                name,
                label,
                from: formatNumber(green.from),
                to: formatNumber(green.to),
                unit,
              })}
              style={styles.track}
            >
              <View
                style={[
                  styles.zone,
                  { width: at(zone.yellowFrom), backgroundColor: color.rangeRed },
                ]}
              />
              <View
                style={[
                  styles.zone,
                  {
                    width: at(zone.greenFrom - zone.yellowFrom),
                    backgroundColor: color.rangeYellow,
                  },
                ]}
              />
              <View
                style={[
                  styles.zone,
                  { width: at(zone.greenTo - zone.greenFrom), backgroundColor: color.rangeGreen },
                ]}
              />
              <View
                style={[
                  styles.zone,
                  { width: at(zone.yellowTo - zone.greenTo), backgroundColor: color.rangeYellow },
                ]}
              />
              <View style={[styles.zone, styles.grow, { backgroundColor: color.rangeRed }]} />
              {value > 0 ? (
                <View style={[styles.marker, { left: at((value / target) * 100) }]} />
              ) : null}
            </View>
            <View style={styles.edges}>
              <Text style={[type.caption, styles.muted, { left: at(zone.greenFrom) }, styles.edge]}>
                {formatNumber(green.from)}
              </Text>
              <Text style={[type.caption, styles.muted, { left: at(zone.greenTo) }, styles.edge]}>
                {formatNumber(green.to)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rows: { gap: space.md },
  row: { gap: space.xs },
  top: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  grow: { flexGrow: 1 },
  track: { flexDirection: 'row', height: 10, borderRadius: radius.pill, overflow: 'visible' },
  zone: { height: 10 },
  marker: {
    position: 'absolute',
    top: -5,
    width: 4,
    height: 20,
    marginLeft: -2,
    borderRadius: 2,
    backgroundColor: color.ink,
  },
  edges: { height: 16 },
  edge: { position: 'absolute', transform: [{ translateX: -14 }] },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
