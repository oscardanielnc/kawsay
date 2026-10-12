import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { color, font } from '@/lib/theme';
import { gaugeColorAt, gaugePoint, type GaugeBand } from './gauge';

interface Props {
  bands: readonly GaugeBand[];
  /** Zone limits printed outside the arc; `strong` for the green ones. */
  limits: readonly { at: number; text: string; strong?: boolean }[];
  /** Where the needle points (0–1); null hides it (nothing logged yet). */
  needle: number | null;
  /** An optional goal mark on the band (🚩). */
  flag?: number | null;
  value: string;
  unit: string;
  accessibilityLabel: string;
}

/** Geometry in a 240 × 136 box (prototype: docs/design/explorations/2026-10-12-range-gauges.html). */
const W = 240;
const H = 136;
const CENTER = { cx: 120, cy: 112 };
const R = 78;
const BAND = 14;
const SEGMENTS = 96;
const LABEL_W = 48;

const pct = (value: number, of: number) => `${(value / of) * 100}%` as const;

/**
 * A semicircle like a car speedometer: pastel zones blending softly, the zone limits outside the arc, the value large
 * in the middle and a slim needle lying on the band. It fills its width; texts scale with it.
 */
export function ArcGauge({ bands, limits, needle, flag = null, value, unit, accessibilityLabel }: Props) {
  const [width, setWidth] = useState(W);
  const scale = width / W;
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={styles.box}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const a = gaugePoint(i / SEGMENTS, R, CENTER);
          const b = gaugePoint(Math.min(1, (i + 1.6) / SEGMENTS), R, CENTER);
          return (
            <Path
              key={i}
              d={`M${a.x} ${a.y} A${R} ${R} 0 0 1 ${b.x} ${b.y}`}
              stroke={gaugeColorAt((i + 0.5) / SEGMENTS, bands)}
              strokeWidth={BAND}
              strokeLinecap={i === 0 || i === SEGMENTS - 1 ? 'round' : 'butt'}
              fill="none"
            />
          );
        })}
        {limits.map(({ at }) => {
          const a = gaugePoint(at, R + BAND / 2 + 2, CENTER);
          const b = gaugePoint(at, R + BAND / 2 + 6, CENTER);
          return (
            <Line
              key={at}
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
        {needle === null ? null : <Needle position={needle} />}
      </Svg>
      {limits.map(({ at, text, strong }) => {
        const p = gaugePoint(at, R + BAND / 2 + 12, CENTER);
        const side = at < 0.49 ? 'right' : at > 0.51 ? 'left' : 'center';
        return (
          <Text
            key={at}
            importantForAccessibility="no"
            style={[
              styles.limit,
              strong ? styles.strong : styles.muted,
              {
                left: pct(p.x, W),
                top: pct(p.y, H),
                marginLeft: side === 'right' ? -LABEL_W : side === 'center' ? -LABEL_W / 2 : 0,
                textAlign: side,
                fontSize: Math.max(10, (strong ? 11 : 10) * scale),
              },
            ]}
          >
            {text}
          </Text>
        );
      })}
      {flag === null ? null : (
        <Text
          importantForAccessibility="no"
          style={[
            styles.flag,
            {
              left: pct(gaugePoint(flag, R - BAND / 2 - 9, CENTER).x, W),
              top: pct(gaugePoint(flag, R - BAND / 2 - 9, CENTER).y, H),
            },
          ]}
        >
          🚩
        </Text>
      )}
      <View style={[styles.center, { top: pct(CENTER.cy - 40, H) }]}>
        <Text style={[styles.value, { fontSize: 31 * scale, lineHeight: 36 * scale }]}>{value}</Text>
        <Text style={[styles.unit, { fontSize: Math.max(11, 12 * scale) }]}>{unit}</Text>
      </View>
    </View>
  );
}

/** A slim needle lying on the band, pointing at the position. */
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

const styles = StyleSheet.create({
  box: { width: '100%', aspectRatio: W / H },
  limit: { position: 'absolute', width: LABEL_W, marginTop: -8, fontFamily: font.body },
  strong: { color: color.successText, fontFamily: font.label },
  muted: { color: color.inkMuted },
  flag: { position: 'absolute', fontSize: 12, marginLeft: -6, marginTop: -9 },
  center: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  value: { fontFamily: font.title, color: color.ink },
  unit: { fontFamily: font.body, color: color.inkMuted },
});
