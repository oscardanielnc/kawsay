import { greenRange, RANGE_ZONES, rangeState, type Metric } from '@kawsay/core/day/range-state';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
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

const TONE: Record<Tone, { text: string; pill: string; ring: string }> = {
  none: { text: color.inkMuted, pill: color.bg, ring: color.noData },
  neutral: { text: color.inkMuted, pill: color.bg, ring: color.inkMuted },
  green: { text: color.successText, pill: color.green50, ring: color.successText },
  yellow: { text: color.warningText, pill: color.warning50, ring: color.warningText },
  red: { text: color.dangerText, pill: color.danger50, ring: color.dangerText },
};

/** Zones in track order with their share of the width (TRACK_STOPS). */
const SEGMENTS = [
  { width: TRACK_STOPS.yellowFrom, fill: color.rangeRed },
  { width: TRACK_STOPS.greenFrom - TRACK_STOPS.yellowFrom, fill: color.rangeYellow },
  { width: TRACK_STOPS.greenTo - TRACK_STOPS.greenFrom, fill: color.rangeGreen },
  { width: TRACK_STOPS.yellowTo - TRACK_STOPS.greenTo, fill: color.rangeYellow },
  { width: 1 - TRACK_STOPS.yellowTo, fill: color.rangeRed },
] as const;

const pct = (share: number) => `${share * 100}%` as const;

/**
 * Calories and macros as ranges, not numbers to fill (design): the value large, a state pill, and a track whose
 * zones keep fixed widths so the green limits printed under it never crowd each other. Calories lead, larger.
 */
export function RangeRows({ targets, eaten, dayOpen }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.rows}>
      {ROWS.map(({ metric, target: targetKey, eaten: eatenKey, unit }, index) => {
        const target = targets[targetKey];
        const value = eaten[eatenKey];
        const zone = RANGE_ZONES[metric];
        const green = greenRange(metric, target);
        const state = rangeState({ metric, value, target, dayOpen });
        const below = value < green.from;
        let label = t('ranges.inRange');
        let tone: Tone = 'green';
        if (value === 0) [label, tone] = [t('ranges.none'), 'none'];
        else if (state === 'left')
          [label, tone] = [
            t('ranges.left', { amount: formatNumber(green.from - value), unit }),
            'neutral',
          ];
        else if (state === 'yellow')
          [label, tone] = [t(below ? 'ranges.lowish' : 'ranges.highish'), 'yellow'];
        else if (state === 'red') [label, tone] = [t(below ? 'ranges.low' : 'ranges.high'), 'red'];
        const name = t(`ranges.${metric}`);
        const hero = index === 0;
        const look = TONE[tone];
        // Colour is never alone (tokens): ✓ in range, ↓ / ↑ which side it is out.
        const icon =
          tone === 'green' ? '✓' : tone === 'yellow' || tone === 'red' ? (below ? '↓' : '↑') : null;
        return (
          <View key={metric} style={[styles.row, !hero && styles.divided]}>
            <View style={styles.top}>
              <Text style={[type.label, styles.name, styles.grow]}>{name}</Text>
              <View style={[styles.pill, { backgroundColor: look.pill }]}>
                {icon ? (
                  <Text style={[type.label, { color: look.text }]} importantForAccessibility="no">
                    {icon}
                  </Text>
                ) : null}
                <Text style={[type.label, { color: look.text }]}>{label}</Text>
              </View>
            </View>
            <View style={styles.value}>
              <Text style={[hero ? styles.heroNumber : type.title, styles.ink]}>
                {formatNumber(value)}
              </Text>
              <Text style={[type.label, styles.muted]}>{unit}</Text>
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
              style={[styles.track, hero && styles.heroTrack]}
            >
              {SEGMENTS.map((segment, i) => (
                <View
                  key={i}
                  style={[
                    styles.segment,
                    i === 0 && styles.first,
                    i === SEGMENTS.length - 1 && styles.last,
                    { flexGrow: segment.width, backgroundColor: segment.fill },
                  ]}
                />
              ))}
              {value > 0 ? (
                <View
                  style={[
                    styles.marker,
                    hero && styles.heroMarker,
                    {
                      left: pct(trackPosition((value / target) * 100, zone)),
                      borderColor: look.ring,
                    },
                  ]}
                />
              ) : null}
            </View>
            <View style={styles.edges}>
              <Text style={[type.caption, styles.muted, styles.edge, { left: pct(TRACK_STOPS.greenFrom) }]}>
                {formatNumber(green.from)}
              </Text>
              <Text style={[type.caption, styles.muted, styles.edge, { left: pct(TRACK_STOPS.greenTo) }]}>
                {formatNumber(green.to)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const EDGE_WIDTH = 72;
const TRACK = 12;
const HERO_TRACK = 16;
const MARKER = 22;
const HERO_MARKER = 28;

const styles = StyleSheet.create({
  rows: { gap: space.lg },
  row: { gap: space.sm },
  divided: { borderTopWidth: 1, borderTopColor: color.line, paddingTop: space.lg },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flexGrow: 1, flexShrink: 1 },
  name: { color: color.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
  },
  value: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  heroNumber: { ...type.display, fontSize: 44, lineHeight: 48 },
  track: {
    flexDirection: 'row',
    gap: 3,
    height: TRACK,
    marginVertical: (MARKER - TRACK) / 2,
  },
  heroTrack: { height: HERO_TRACK, marginVertical: (HERO_MARKER - HERO_TRACK) / 2 },
  segment: { flexBasis: 0, height: '100%', borderRadius: 3 },
  first: { borderTopLeftRadius: radius.pill, borderBottomLeftRadius: radius.pill },
  last: { borderTopRightRadius: radius.pill, borderBottomRightRadius: radius.pill },
  marker: {
    position: 'absolute',
    top: (TRACK - MARKER) / 2,
    width: MARKER,
    height: MARKER,
    marginLeft: -MARKER / 2,
    borderRadius: radius.pill,
    borderWidth: 4,
    backgroundColor: color.surface,
    elevation: 3,
    shadowColor: color.ink,
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  heroMarker: {
    top: (HERO_TRACK - HERO_MARKER) / 2,
    width: HERO_MARKER,
    height: HERO_MARKER,
    marginLeft: -HERO_MARKER / 2,
    borderWidth: 5,
  },
  edges: { height: 16 },
  edge: { position: 'absolute', width: EDGE_WIDTH, marginLeft: -EDGE_WIDTH / 2, textAlign: 'center' },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
