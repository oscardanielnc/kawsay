import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useAnimatedTo } from '@/lib/motion';
import { color, motion, type } from '@/lib/theme';
import {
  GAUGE_BOX,
  needleAngle,
  ZONE_COLOR,
  ZONE_PATHS,
  ZONES,
  type GaugeKind,
} from './gauge-zones';

const { cx, cy } = GAUGE_BOX;

interface Props {
  kind: GaugeKind;
  /** Where the needle points (0–1); null hides it (nothing logged yet). */
  position: number | null;
  /** A second, grey needle: where the value is now, before a change (portion preview, M5). */
  before?: number | null;
  value: string;
  unit: string;
  accessibilityLabel: string;
  /** Smaller numbers for the mini gauges of the portion preview. */
  compact?: boolean;
}

/** Arc gauge of the Amanecer redesign: fixed zones, a needle that sweeps in, the value under the arc. */
export function ZoneGauge({
  kind,
  position,
  before = null,
  value,
  unit,
  accessibilityLabel,
  compact = false,
}: Props) {
  return (
    <View accessible accessibilityLabel={accessibilityLabel}>
      <View style={styles.box}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${GAUGE_BOX.width} ${GAUGE_BOX.height}`}>
          {ZONE_PATHS[kind].map((d, i) => (
            <Path
              key={d}
              d={d}
              stroke={position === null ? color.noData : ZONE_COLOR[ZONES[kind][i]!.zone]}
              strokeWidth={12}
              strokeLinecap="round"
              fill="none"
            />
          ))}
          {before !== null ? <Needle position={before} ink={color.faceOffInk} /> : null}
          {position !== null ? <Needle position={position} ink={color.ink} /> : null}
          <Circle cx={cx} cy={cy} r={7} fill={color.ink} />
          <Circle cx={cx} cy={cy} r={2.6} fill={color.white} />
        </Svg>
      </View>
      {/* The reading sits under the arc, never over the needle's hub (owner, 2026-10-30). */}
      {value ? (
        <View style={styles.reading}>
          <Text
            style={[type.number, styles.ink, styles.value, compact && styles.compact]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
          <Text style={[type.label, styles.muted]}>{unit}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * A needle from the centre, rotated from pointing left; it sweeps to its angle in 380 ms. The angle reaches the SVG
 * through React state: writing an SVG transform with setNativeProps closed the app on the phone (new architecture).
 */
function Needle({ position, ink }: { position: number; ink: string }) {
  const angle = useAnimatedTo(needleAngle(position), motion.needle, { native: false });
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = angle.addListener(({ value }) => setShown(value));
    // The value may have moved before this listener existed (reduce motion jumps at once).
    const frame = requestAnimationFrame(() =>
      setShown((angle as unknown as { __getValue(): number }).__getValue()),
    );
    return () => {
      cancelAnimationFrame(frame);
      angle.removeListener(id);
    };
  }, [angle]);
  return (
    <G transform={`rotate(${shown} ${cx} ${cy})`}>
      <Path d={`M${cx} ${cy} L34 ${cy}`} stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
    </G>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', aspectRatio: GAUGE_BOX.width / GAUGE_BOX.height },
  reading: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  value: { fontSize: 22, lineHeight: 26 },
  compact: { fontSize: 16, lineHeight: 20 },
});
