import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type Shape = { d: string } | { circle: [number, number, number] };

/** Line icons of the design (Today v3 and routine prototypes) for activity types and exercise kinds. */
const ICONS: Record<string, { color: string; shapes: Shape[] }> = {
  walking: {
    color: '#3E8A55',
    shapes: [{ circle: [13, 4, 2] }, { d: 'M9 21l2-6 3 2v4M8 12l3-4 3 1 3 4M11 15l-1-5' }],
  },
  weights: { color: '#B84E18', shapes: [{ d: 'M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12' }] },
  stairs: { color: '#5B8DB8', shapes: [{ d: 'M3 20h5v-5h5v-5h5V5h3' }] },
  jogging: { color: '#D9473B', shapes: [{ d: 'M3 12h4l2-5 4 10 2-5h6' }] },
  motorbike: {
    color: '#6B5E55',
    shapes: [
      { circle: [6, 17, 3] },
      { circle: [18, 17, 3] },
      { d: 'M6 17l4-6h5l3 6M12 11l-1-3h3' },
    ],
  },
  housework: { color: '#9A6B00', shapes: [{ d: 'M4 11l8-7 8 7v9H4z' }, { d: 'M10 20v-5h4v5' }] },
  football: {
    color: '#3D4C8C',
    shapes: [{ circle: [12, 12, 8] }, { d: 'M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16' }],
  },
  cycling: {
    color: '#255E3B',
    shapes: [{ circle: [6, 16, 4] }, { circle: [18, 16, 4] }, { d: 'M6 16l4-8h5l3 8M9 8h3' }],
  },
  bodyweight: {
    color: '#3D4C8C',
    shapes: [{ circle: [12, 5, 2] }, { d: 'M12 7v7M8 21l4-7 4 7M7 10h10' }],
  },
  circuit: {
    color: '#D9473B',
    shapes: [{ circle: [12, 4, 2] }, { d: 'M12 6v6M12 12l-4 4M12 12l3 5M8 9l4 1 4-3' }],
  },
  isometric: { color: '#255E3B', shapes: [{ d: 'M3 16h18M6 16l3-5h8' }, { circle: [18, 9, 2] }] },
  mobility: {
    color: '#9A6B00',
    shapes: [{ circle: [12, 5, 2] }, { d: 'M12 7v6l-4 7M12 13l4 7M5 9l7 2 7-2' }],
  },
};

/** An activity or exercise icon in its tinted tile; decorative (the name is always next to it). */
export function ActivityIcon({ kind, size = 40 }: { kind: string; size?: number }) {
  const { color, shapes } = ICONS[kind] ?? ICONS.walking!;
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: `${color}22`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {shapes.map((shape, i) =>
          'd' in shape ? (
            <Path key={i} d={shape.d} />
          ) : (
            <Circle key={i} cx={shape.circle[0]} cy={shape.circle[1]} r={shape.circle[2]} />
          ),
        )}
      </Svg>
    </View>
  );
}
