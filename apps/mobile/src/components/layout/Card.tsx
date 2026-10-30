import type { ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useRise } from '@/lib/motion';
import { color, radius, shadow, space, type } from '@/lib/theme';

/** A floating white card (Amanecer): it rises 8 px and fades in when it appears. */
export function Card({
  title,
  action,
  children,
}: {
  title?: string;
  /** Sits at the right of the title, e.g. a "+" that never moves. */
  action?: ReactNode;
  children: ReactNode;
}) {
  const rise = useRise();
  const entrance = {
    opacity: rise,
    transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };
  return (
    <Animated.View style={[styles.card, entrance]}>
      {title || action ? (
        <View style={styles.head}>
          {title ? (
            <Text accessibilityRole="header" style={[type.heading, styles.title]}>
              {title}
            </Text>
          ) : null}
          {action}
        </View>
      ) : null}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.lg + 1,
    gap: space.sm,
    ...shadow,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  title: { color: color.ink, flex: 1 },
});
