import { addDays, localDateOf, type LocalDate } from '@kawsay/core/shared/local-date';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, radius, space, touch, type } from '@/lib/theme';
import { formatDay } from './format-day';

interface Props {
  /** Injected clock and zone (ADR 0016); the route passes the real ones. */
  now: Date;
  timeZone: string;
  /** The day shown; today when absent. Past days use the same screen (design). */
  day?: LocalDate;
  onDay?: (day: LocalDate) => void;
  /** Sections composed by the route from other features (rings, ranges, meals, activity…). */
  children?: ReactNode;
}

export function TodayScreen({ now, timeZone, day, onDay, children }: Props) {
  const { t, i18n } = useTranslation();
  const today = localDateOf(now, timeZone);
  const shown = day ?? today;
  const isToday = shown === today;
  const arrow = (label: string, glyph: string, target: LocalDate, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onDay?.(target)}
      style={[styles.arrow, disabled && styles.dim]}
    >
      <Text style={[type.title, styles.brand]}>{glyph}</Text>
    </Pressable>
  );
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {arrow(t('today.previous'), '‹', addDays(shown, -1), false)}
          <View style={styles.grow}>
            <Text accessibilityRole="header" style={[type.title, styles.ink]}>
              {isToday ? t('today.title') : formatDay(shown, i18n.language)}
            </Text>
            {isToday ? (
              <Text style={[type.body, styles.muted]}>{formatDay(shown, i18n.language)}</Text>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => onDay?.(today)} hitSlop={8}>
                <Text style={[type.label, styles.brand]}>{t('today.backToToday')}</Text>
              </Pressable>
            )}
          </View>
          {arrow(t('today.next'), '›', addDays(shown, 1), shown >= today)}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  arrow: {
    width: touch,
    height: touch,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { opacity: 0.3 },
  grow: { flex: 1 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  brand: { color: color.brand },
});
