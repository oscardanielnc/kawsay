import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

/** The Bristol stool scale drawn small, 1 … 7. */
export function Bristol({ type }: { type: number }) {
  const fill = type <= 2 ? '#6B3E1E' : type <= 4 ? '#8A5A2B' : type <= 6 ? '#B07A47' : '#C99460';
  const shapes: Record<number, ReactNode> = {
    1: (
      <>
        <Circle cx={7} cy={12} r={2.6} />
        <Circle cx={12.5} cy={10} r={2.6} />
        <Circle cx={17.5} cy={13} r={2.6} />
        <Circle cx={12} cy={15.5} r={2.2} />
      </>
    ),
    2: (
      <Path d="M3 12c0-2.5 2-3.5 4.5-3.5s2.5 2 4.5 2 2.5-2 4.5-2S21 9.5 21 12s-2 3.5-4.5 3.5-2.5-2-4.5-2-2.5 2-4.5 2S3 14.5 3 12z" />
    ),
    3: <Rect x={3} y={9} width={18} height={6.5} rx={3.2} />,
    4: (
      <Path d="M3 13.5c2.5-4 6.5-4 9.5-3s6.5 1 8.5-1.5v3c-2 2.5-5.5 2.5-8.5 1.5S5.5 12.5 3 16.5z" />
    ),
    5: (
      <>
        <Ellipse cx={7} cy={12.5} rx={3.3} ry={2.4} />
        <Ellipse cx={13.5} cy={11} rx={3.3} ry={2.4} />
        <Ellipse cx={18.5} cy={14} rx={2.6} ry={2} />
      </>
    ),
    6: (
      <Path d="M3.5 14c1-3 3-1 4-2.5s2.5-3 4.5-1 2.5-2 4.5 0 3.5 2 4 1.5c0 3-3 4-8.5 4s-8.5-.5-8.5-2z" />
    ),
    7: <Path d="M3 14c3-2.5 5.5 2 9 0s6-2.5 9 0c-2 3-6 4-9 4s-7-1-9-4z" opacity={0.7} />,
  };
  return (
    <Svg width={38} height={28} viewBox="0 0 24 24" fill={fill}>
      {shapes[type]}
    </Svg>
  );
}

export function Gas() {
  return (
    <Svg width={38} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 15c2-3 4 0 6-2s4-4 6-1 2 3 2 3"
        stroke="#6B3E1E"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
