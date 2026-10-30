import Svg, { Circle, Path } from 'react-native-svg';
import { color, faceColor } from '@/lib/theme';

/** Eyes, mouth and extras of the five faces, most negative first (Amanecer components, 48 × 48). */
const FACES = [
  {
    eyes: 'M13 20q4 3 8 0M27 20q4 3 8 0',
    eyeWidth: 2.6,
    mouth: 'M16 36q8-8 16 0',
    fill: false,
    tear: 1,
    blush: 0,
  },
  {
    eyes: 'M13 15l6-2M35 15l-6-2M17 21l0 .01M31 21l0 .01',
    eyeWidth: 3.6,
    mouth: 'M17 34q7-5 14 0',
    fill: false,
    tear: 0,
    blush: 0,
  },
  {
    eyes: 'M17 20l0 .01M31 20l0 .01',
    eyeWidth: 4.4,
    mouth: 'M17 32h14',
    fill: false,
    tear: 0,
    blush: 0,
  },
  {
    eyes: 'M17 20l0 .01M31 20l0 .01',
    eyeWidth: 4.4,
    mouth: 'M16 29q8 7 16 0',
    fill: false,
    tear: 0,
    blush: 0.35,
  },
  {
    eyes: 'M13 21q4-5 8 0M27 21q4-5 8 0',
    eyeWidth: 2.6,
    mouth: 'M14 27h20q0 11-10 11T14 27z',
    fill: true,
    tear: 0,
    blush: 0.6,
  },
] as const;
const FACE_INK = '#4A2A16';

/**
 * A face without background, 0 = most negative … 4 = most positive. Grey until picked (`on`), then its own colour:
 * crying red, frowning orange, flat yellow, smiling yellow, beaming yellow.
 */
export function Face({ level, on, size = 40 }: { level: number; on: boolean; size?: number }) {
  const face = FACES[level] ?? FACES[2];
  const ink = on ? FACE_INK : color.faceOffInk;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle
        cx={24}
        cy={24}
        r={21}
        fill={on ? (faceColor[level] ?? faceColor[2]) : color.faceOffFill}
      />
      <Path
        d={face.eyes}
        stroke={ink}
        strokeWidth={face.eyeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={face.mouth}
        stroke={ink}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={face.fill ? (on ? '#7A3414' : color.faceOffInk) : 'none'}
      />
      {on && face.tear ? (
        <Path d="M33 24c0 0-3 4-3 6.2a3 3 0 0 0 6 0c0-2.2-3-6.2-3-6.2z" fill="#6FB3F2" />
      ) : null}
      {on && face.blush ? (
        <>
          <Circle cx={12} cy={29} r={3.5} fill="#FF8A7A" opacity={face.blush} />
          <Circle cx={36} cy={29} r={3.5} fill="#FF8A7A" opacity={face.blush} />
        </>
      ) : null}
    </Svg>
  );
}
