import { arcPoint, layoutLabels, type GaugeGeometry } from '@kawsay/core/gauge/label-layout';
import type { GaugeScale } from '@kawsay/core/gauge/scale';
import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { formatNumber } from '@/lib/format';
import { color, font } from '@/lib/theme';
import { ZONE_COLOR } from './gauge-zones';

/** The big gauge of the detail sheet (design/explorations/2026-11-01-gauge-detail.html): a 358 × 184 drawing. */
const G: GaugeGeometry = { cx: 179, cy: 156, r: 92, band: 22 };
const W = G.cx * 2;
const H = 184;
const LABEL_W = 64;
const MARGIN = 6;
/** A small gap between zones, as a share of the arc; a zone never draws under 1°. */
const GAP = 0.006;
const MIN = 1 / 180;
/** Plus Jakarta Sans 800 at 14: a figure is about 8.6 wide, a comma about 4. */
const textWidth = (text: string) => [...text].reduce((w, c) => w + (/\d/.test(c) ? 8.6 : 4), 0);

function arc(f0: number, f1: number): string {
  const a = arcPoint(f0, G.r, G);
  const b = arcPoint(f1, G.r, G);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${G.r} ${G.r} 0 ${f1 - f0 > 0.5 ? 1 : 0} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

interface Props {
  scale: GaugeScale;
  /** Needle position 0–1; null hides it. */
  position: number | null;
  /** Read by screen readers: the value and the limits. */
  accessibilityLabel: string;
}

/**
 * The gauge large, at real scale (ADR 0027): every limit has a tick on the arc and a dotted leader to its number in a
 * side column, with a two-tone dot of the zones it separates (F26). 0 and the maximum sit under the ends.
 */
export function BigGauge({ scale, position, accessibilityLabel }: Props) {
  const { zones } = scale;
  const limits = useMemo(() => zones.slice(1).map((z) => z.from), [zones]);
  const placed = useMemo(
    () => layoutLabels(limits, G, { labelWidth: LABEL_W, margin: MARGIN }),
    [limits],
  );
  const valueAt = (f: number) => scale.min + f * (scale.max - scale.min);
  const tip = position === null ? null : arcPoint(position, G.r - G.band / 2 - 8, G);

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width="100%" height={undefined} viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: W / H }}>
        {zones.map((z, i) => {
          let f0 = z.from + (i > 0 ? GAP / 2 : 0);
          let f1 = z.to - (i < zones.length - 1 ? GAP / 2 : 0);
          if (f1 - f0 < MIN) [f0, f1] = [(f0 + f1) / 2 - MIN / 2, (f0 + f1) / 2 + MIN / 2];
          return (
            <Path
              key={`${z.from}-${z.tone}`}
              d={arc(f0, f1)}
              stroke={position === null ? color.noData : ZONE_COLOR[z.tone]}
              strokeWidth={G.band}
              fill="none"
            />
          );
        })}
        {placed.map((p) => {
          const text = formatNumber(valueAt(p.fraction));
          const w = textWidth(text);
          const dotX = p.side === 'left' ? p.textX + w + 10 : p.textX - w - 10;
          const leaderEnd = p.side === 'left' ? dotX + 8 : dotX - 8;
          const left = ZONE_COLOR[zones[p.index]!.tone];
          const right = ZONE_COLOR[zones[p.index + 1]!.tone];
          return (
            <Leader
              key={p.index}
              tick={p.tick}
              leader={`${p.tick[1].x},${p.tick[1].y} ${p.elbow.x},${p.elbow.y} ${leaderEnd},${p.y}`}
              text={text}
              textX={p.textX}
              y={p.y}
              anchor={p.side === 'left' ? 'start' : 'end'}
              dotX={dotX}
              dot={[left, right]}
            />
          );
        })}
        {(
          [
            [0, 'start', -G.band / 2],
            [1, 'end', G.band / 2],
          ] as const
        ).map(([f, anchor, dx]) => (
          <SvgText
            key={f}
            x={arcPoint(f, G.r, G).x + dx}
            y={G.cy + 22}
            textAnchor={anchor}
            fontSize={12}
            fontFamily={font.label}
            fill={color.inkMuted}
          >
            {formatNumber(valueAt(f))}
          </SvgText>
        ))}
        {tip ? (
          <Line
            x1={G.cx}
            y1={G.cy}
            x2={tip.x}
            y2={tip.y}
            stroke={color.ink}
            strokeWidth={4}
            strokeLinecap="round"
          />
        ) : null}
        <Circle cx={G.cx} cy={G.cy} r={8} fill={color.ink} />
        <Circle cx={G.cx} cy={G.cy} r={3} fill={color.white} />
      </Svg>
    </View>
  );
}

function Leader({
  tick,
  leader,
  text,
  textX,
  y,
  anchor,
  dotX,
  dot,
}: {
  tick: [{ x: number; y: number }, { x: number; y: number }];
  leader: string;
  text: string;
  textX: number;
  y: number;
  anchor: 'start' | 'end';
  dotX: number;
  dot: [string, string];
}) {
  return (
    <>
      <Line
        x1={tick[0].x}
        y1={tick[0].y}
        x2={tick[1].x}
        y2={tick[1].y}
        stroke={color.ink}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Polyline
        points={leader}
        fill="none"
        stroke={color.inkMuted}
        strokeWidth={1.2}
        strokeDasharray="2 3"
      />
      <Path d={`M ${dotX} ${y - 5} A 5 5 0 0 0 ${dotX} ${y + 5} Z`} fill={dot[0]} />
      <Path d={`M ${dotX} ${y - 5} A 5 5 0 0 1 ${dotX} ${y + 5} Z`} fill={dot[1]} />
      <SvgText
        x={textX}
        y={y + 5}
        textAnchor={anchor}
        fontSize={14}
        fontFamily={font.display}
        fill={color.ink}
      >
        {text}
      </SvgText>
    </>
  );
}
