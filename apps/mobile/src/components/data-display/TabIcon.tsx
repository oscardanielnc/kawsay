import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type TabName = 'index' | 'calendar' | 'log' | 'insights' | 'profile';

/** Line icons of the five tabs (design N1), drawn in the tab's current colour. */
export function TabIcon({
  tab,
  color,
  size = 24,
}: {
  tab: TabName;
  color: ColorValue;
  size?: number;
}) {
  const stroke = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {tab === 'index' ? (
        <>
          <Circle cx={12} cy={12} r={4} {...stroke} />
          <Path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            {...stroke}
          />
        </>
      ) : null}
      {tab === 'calendar' ? (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={2} {...stroke} />
          <Path d="M3 10h18M8 3v4M16 3v4" {...stroke} />
        </>
      ) : null}
      {tab === 'log' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M12 8v8M8 12h8" {...stroke} />
        </>
      ) : null}
      {tab === 'insights' ? <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...stroke} /> : null}
      {tab === 'profile' ? (
        <>
          <Circle cx={12} cy={8} r={4} {...stroke} />
          <Path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" {...stroke} />
        </>
      ) : null}
    </Svg>
  );
}
