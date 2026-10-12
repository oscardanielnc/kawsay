import { greenRange, RANGE_ZONES, rangeState, type Metric } from '@kawsay/core/day/range-state';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { formatNumber } from '@/lib/format';
import { color, font, radius, space, type } from '@/lib/theme';
import { gaugeColorAt, gaugePoint } from './gauge';
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

/** Gauge geometry in a 240 × 136 box (prototype: docs/design/explorations/2026-10-12-range-gauges.html). */
const W = 240;
const H = 136;
const CENTER = { cx: 120, cy: 112 };
const R = 78;
const BAND = 14;
const SEGMENTS = 96;
const LIMITS = ['yellowFrom', 'greenFrom', 'greenTo', 'yellowTo'] as const;
const LABEL_W = 44;

const pct = (value: number, of: number) => `${(value / of) * 100}%` as const;

/** One soft band: many short arcs, each in the colour of its place, overlapping so no seam shows. */
function Band() {
  return Array.from({ length: SEGMENTS }, (_, i) => {
    const a = gaugePoint(i / SEGMENTS, R, CENTER);
    const b = gaugePoint(Math.min(1, (i + 1.6) / SEGMENTS), R, CENTER);
    return (
      <Path
        key={i}
        d={`M${a.x} ${a.y} A${R} ${R} 0 0 1 ${b.x} ${b.y}`}
        stroke={gaugeColorAt((i + 0.5) / SEGMENTS)}
        strokeWidth={BAND}
        strokeLinecap={i === 0 || i === SEGMENTS - 1 ? 'round' : 'butt'}
        fill="none"
      />
    );
  });
}

/** A slim needle lying on the band, pointing at the position, like a car speedometer. */
function Needle({ position }: { position: number }) {
  const tip = gaugePoint(position, R + BAND / 2 - 1, CENTER);
  const base = gaugePoint(position, R - BAND / 2 - 11, CENTER);
  const angle = Math.PI * (1 - position);
  const [nx, ny] = [-Math.sin(angle) * 2.2, -Math.cos(angle) * 2.2];
  return (
    <>
      <Path
        d={`M${base.x + nx} ${base.y + ny} L${tip.x} ${tip.y} L${base.x - nx} ${base.y - ny} Z`}
        fill={color.ink}
        stroke={color.surface}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx={base.x} cy={base.y} r={2.6} fill={color.ink} />
    </>
  );
}

function Gauge({
  metric,
  value,
  target,
  unit,
  name,
  label,
  tone,
}: {
  metric: Metric;
  value: number;
  target: number;
  unit: string;
  name: string;
  label: string;
  tone: Tone;
}) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(W);
  const scale = width / W;
  const zone = RANGE_ZONES[metric];
  const green = greenRange(metric, target);
  const look = TONE[tone];
  return (
    <View style={styles.card}>
      <Text style={[type.heading, styles.ink]} numberOfLines={1}>
        {name}
      </Text>
      <View
        accessible
        accessibilityLabel={t('ranges.track', {
          name,
          label,
          from: formatNumber(green.from),
          to: formatNumber(green.to),
          unit,
        })}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={styles.gauge}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
          <Band />
          {LIMITS.map((limit) => {
            const a = gaugePoint(TRACK_STOPS[limit], R + BAND / 2 + 2, CENTER);
            const b = gaugePoint(TRACK_STOPS[limit], R + BAND / 2 + 6, CENTER);
            return (
              <Line
                key={limit}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color.inkMuted}
                strokeOpacity={0.6}
                strokeWidth={1.2}
              />
            );
          })}
          {value > 0 ? <Needle position={trackPosition((value / target) * 100, zone)} /> : null}
        </Svg>
        {LIMITS.map((limit) => {
          const at = TRACK_STOPS[limit];
          const p = gaugePoint(at, R + BAND / 2 + 12, CENTER);
          const isGreen = limit === 'greenFrom' || limit === 'greenTo';
          const side = at < 0.4 ? 'right' : at > 0.6 ? 'left' : 'center';
          return (
            <Text
              key={limit}
              importantForAccessibility="no"
              style={[
                styles.limit,
                isGreen ? styles.limitGreen : styles.muted,
                {
                  left: pct(p.x, W),
                  top: pct(p.y, H),
                  marginLeft: side === 'right' ? -LABEL_W : side === 'center' ? -LABEL_W / 2 : 0,
                  textAlign: side,
                  fontSize: Math.max(10, (isGreen ? 11 : 10) * scale),
                },
              ]}
            >
              {formatNumber((target * zone[limit]) / 100)}
            </Text>
          );
        })}
        <View style={[styles.center, { top: pct(CENTER.cy - 40, H) }]}>
          <Text style={[styles.value, { fontSize: 31 * scale, lineHeight: 36 * scale }]}>
            {formatNumber(value)}
          </Text>
          <Text style={[type.caption, styles.muted]}>{unit}</Text>
        </View>
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
        {ROWS.map(({ metric, target: targetKey, eaten: eatenKey, unit }) => {
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
            [label, tone] = [`${below ? '↓' : '↑'} ${t(below ? 'ranges.low' : 'ranges.high')}`, 'red'];
          return (
            <Gauge
              key={metric}
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
  gauge: { width: '100%', aspectRatio: W / H },
  limit: { position: 'absolute', width: LABEL_W, marginTop: -8, fontFamily: font.body },
  limitGreen: { color: color.successText, fontFamily: font.label },
  center: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  value: { fontFamily: font.title, color: color.ink },
  pill: {
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
  },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
