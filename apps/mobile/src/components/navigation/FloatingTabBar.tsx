import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { TabIcon, type TabName } from '@/components/data-display/TabIcon';
import { color, font, radius, shadow, space } from '@/lib/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** The centre tab is a round "+" (design N1). */
const CENTRE: TabName = 'log';
export const TAB_BAR_HEIGHT = 72;

/**
 * Floating tab bar of the Amanecer redesign: white at 92 % with a soft shadow (no blur), 16 from the sides and 24
 * from the bottom, a blue gradient "+" in the middle.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: Math.max(24, insets.bottom + 8) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = descriptors[route.key]?.options.title ?? route.name;
          const name = route.name as TabName;
          const go = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          if (name === CENTRE) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: focused }}
                onPress={go}
                style={styles.plus}
              >
                <Svg width={56} height={56} style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient id="tab-plus" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={color.blue500} />
                      <Stop offset="1" stopColor={color.blue700} />
                    </LinearGradient>
                  </Defs>
                  <Rect width={56} height={56} rx={28} fill="url(#tab-plus)" />
                </Svg>
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 5v14M5 12h14"
                    stroke={color.white}
                    strokeWidth={2.6}
                    strokeLinecap="round"
                  />
                </Svg>
              </Pressable>
            );
          }
          const tint = focused ? color.blue700 : color.inkMuted;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              onPress={go}
              style={styles.tab}
            >
              <TabIcon tab={name} color={tint} />
              <Text style={[styles.label, { color: tint }, focused && styles.focused]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, right: space.lg },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: space.sm,
    ...shadow,
    shadowOpacity: 0.14,
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 56 },
  label: { fontFamily: font.label, fontSize: 11, lineHeight: 14 },
  focused: { fontFamily: font.strong },
  plus: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowColor: color.blue700,
    shadowOpacity: 0.35,
    elevation: 6,
  },
});
