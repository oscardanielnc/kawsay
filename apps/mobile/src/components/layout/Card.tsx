import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, radius, space, type } from '@/lib/theme';

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? (
        <Text accessibilityRole="header" style={[type.label, styles.title]}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.card, padding: space.lg, gap: space.sm },
  title: { color: color.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
});
