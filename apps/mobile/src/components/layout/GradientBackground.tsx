import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { color } from '@/lib/theme';

const STOPS = [0, 0.3, 0.62, 1] as const;

/** The Amanecer sky behind every screen: light blues at the top to soft peach at the bottom. */
export function GradientBackground({ children }: { children: ReactNode }) {
  return (
    <View style={styles.fill}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="amanecer" x1="0" y1="0" x2="0" y2="1">
            {STOPS.map((offset, i) => (
              <Stop key={offset} offset={offset} stopColor={color.gradient[i]} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#amanecer)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: color.gradient[1] } });
