import type { ReactElement } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

/** The 12 dish icons of the design (Today v3 prototype): colour, simple shapes, drawn on a 48 × 48 grid. */
const ICONS: Record<string, { bg: string; shape: ReactElement }> = {
  sopa: {
    bg: '#FBE9DF',
    shape: (
      <>
        <Path d="M7 22h34a17 17 0 0 1-34 0z" fill="#E08A4F" />
        <Path d="M7 22h34" stroke="#8A3E14" strokeWidth={2.5} />
        <Path
          d="M18 9c0 3 3 3 3 6M26 9c0 3 3 3 3 6"
          stroke="#B9B6AE"
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },
  plato: {
    bg: '#FBEFD8',
    shape: (
      <>
        <Circle cx={24} cy={26} r={15} fill="#fff" stroke="#C9A227" strokeWidth={2.5} />
        <Circle cx={24} cy={26} r={8} fill="#E9C46A" />
        <Path
          d="M6 10v10M4 10v6M8 10v6M42 10v20"
          stroke="#6B5E55"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      </>
    ),
  },
  arroz: {
    bg: '#F4F1EA',
    shape: (
      <>
        <Path d="M8 26h32a16 16 0 0 1-32 0z" fill="#B3392F" />
        <Path d="M10 26c2-9 26-9 28 0z" fill="#fff" stroke="#D9D4C8" strokeWidth={2} />
      </>
    ),
  },
  hoja: {
    bg: '#E3EFE6',
    shape: (
      <>
        <Path d="M10 34c0-14 12-24 28-24 0 16-10 28-24 28" fill="#3E8A55" />
        <Path d="M14 34l18-18" stroke="#D5EBDB" strokeWidth={2.2} strokeLinecap="round" />
        <Circle cx={25} cy={27} r={5} fill="#E9C46A" />
      </>
    ),
  },
  brocheta: {
    bg: '#F8E3DD',
    shape: (
      <>
        <Path d="M8 40L40 8" stroke="#8A6A4A" strokeWidth={2.5} strokeLinecap="round" />
        <Rect
          x={13}
          y={25}
          width={10}
          height={10}
          rx={3}
          transform="rotate(-45 18 30)"
          fill="#9E2B25"
        />
        <Rect
          x={21}
          y={17}
          width={10}
          height={10}
          rx={3}
          transform="rotate(-45 26 22)"
          fill="#B84E18"
        />
        <Rect
          x={29}
          y={9}
          width={9}
          height={9}
          rx={3}
          transform="rotate(-45 33 13)"
          fill="#9E2B25"
        />
      </>
    ),
  },
  fruta: {
    bg: '#FBE4E1',
    shape: (
      <>
        <Path
          d="M24 15c-9-4-15 3-13 11 2 10 8 15 13 11 5 4 11-1 13-11 2-8-4-15-13-11z"
          fill="#D9473B"
        />
        <Path
          d="M24 15c0-4 2-6 6-7"
          stroke="#3E8A55"
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },
  pan: {
    bg: '#F6EBD6',
    shape: (
      <Path
        d="M8 22c0-7 7-10 16-10s16 3 16 10c0 2-2 3-3 3v11H11V25c-1 0-3-1-3-3z"
        fill="#D9A15A"
        stroke="#9A6B00"
        strokeWidth={2}
      />
    ),
  },
  huevo: {
    bg: '#FFF8E1',
    shape: (
      <>
        <Ellipse cx={24} cy={26} rx={15} ry={12} fill="#fff" stroke="#D9D4C8" strokeWidth={2} />
        <Circle cx={24} cy={26} r={6} fill="#F2B705" />
      </>
    ),
  },
  pescado: {
    bg: '#E2EEF6',
    shape: (
      <>
        <Path d="M8 24c6-9 18-11 26 0-8 11-20 9-26 0z" fill="#5B8DB8" />
        <Path d="M34 24l8-7v14z" fill="#5B8DB8" />
        <Circle cx={15} cy={22} r={1.8} fill="#fff" />
      </>
    ),
  },
  dulce: {
    bg: '#F8E3EE',
    shape: (
      <>
        <Path d="M12 24h24l-3 14H15z" fill="#C46A9A" />
        <Path d="M12 24c0-7 5-11 12-11s12 4 12 11z" fill="#F4C6DC" />
        <Circle cx={24} cy={10} r={3} fill="#D9473B" />
      </>
    ),
  },
  nuez: {
    bg: '#F3E7DC',
    shape: (
      <>
        <Ellipse cx={18} cy={26} rx={8} ry={11} fill="#B07A47" />
        <Ellipse cx={30} cy={22} rx={8} ry={11} fill="#C99460" />
      </>
    ),
  },
  jugo: {
    bg: '#FFF1D6',
    shape: (
      <>
        <Path d="M14 12h20l-3 28H17z" fill="#F2A541" stroke="#B87A1E" strokeWidth={2} />
        <Path d="M28 12l5-7" stroke="#3E8A55" strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M15 20h18" stroke="#fff" strokeWidth={2} />
      </>
    ),
  },
};

/** A dish icon in its coloured tile; decorative, so screen readers skip it (the name is next to it). */
export function FoodIcon({ icon, size = 48 }: { icon: string; size?: number }) {
  const { bg, shape } = ICONS[icon] ?? ICONS.plato!;
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 48 48">
        {shape}
      </Svg>
    </View>
  );
}
