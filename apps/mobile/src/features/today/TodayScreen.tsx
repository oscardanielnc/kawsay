import { addDays, localDateOf, type LocalDate } from '@kawsay/core/shared/local-date';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { GradientBackground } from '@/components/layout/GradientBackground';
import { Button } from '@/components/primitives/Button';
import { color, radius, space, touch, type, screenPadding, tabBarSpace } from '@/lib/theme';
import type { Area } from './day-logged';
import { formatDay } from './format-day';

interface Props {
  /** Injected clock and zone (ADR 0016); the route passes the real ones. */
  now: Date;
  timeZone: string;
  /** The day shown; today when absent. Past days use the same screen (design). */
  day?: LocalDate;
  onDay?: (day: LocalDate) => void;
  /** Ring parts still to log, in ring order: "Review my day" jumps to the first (design, Today 10). */
  pending?: readonly Area[];
  /** A section to scroll to, e.g. from the (+) tab; a new `focusKey` repeats the jump. */
  focus?: string | null;
  focusKey?: string;
  /** Sections composed by the route from other features (rings, ranges, meals, activity…). */
  children?: ReactNode;
}

const Positions = createContext<((id: string, y: number) => void) | null>(null);

/** Wraps a section so Today can scroll to it by id ("Review my day", the (+) grid). */
export function TodaySection({ id, children }: { id: string; children: ReactNode }) {
  const register = useContext(Positions);
  return <View onLayout={(e) => register?.(id, e.nativeEvent.layout.y)}>{children}</View>;
}

export function TodayScreen({
  now,
  timeZone,
  day,
  onDay,
  pending,
  focus,
  focusKey,
  children,
}: Props) {
  const { t, i18n } = useTranslation();
  const scroll = useRef<ScrollView>(null);
  const positions = useRef(new Map<string, number>());
  const today = localDateOf(now, timeZone);
  const shown = day ?? today;
  const isToday = shown === today;

  const goTo = (id: string) => {
    const y = positions.current.get(id);
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - space.sm), animated: true });
  };
  useEffect(() => {
    if (!focus) return;
    // Wait one frame so freshly loaded sections have reported their position.
    const timer = setTimeout(() => {
      const y = positions.current.get(focus);
      if (y !== undefined)
        scroll.current?.scrollTo({ y: Math.max(0, y - space.sm), animated: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [focus, focusKey]);

  const arrow = (label: string, path: string, target: LocalDate, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onDay?.(target)}
      style={[styles.arrow, disabled && styles.dim]}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d={path}
          stroke={color.ink}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
  const next = pending?.[0];
  return (
    <GradientBackground>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView ref={scroll} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.grow}>
              {isToday ? (
                <Text style={[type.section, styles.soft]}>{formatDay(shown, i18n.language)}</Text>
              ) : (
                <Pressable accessibilityRole="button" onPress={() => onDay?.(today)} hitSlop={8}>
                  <Text style={[type.section, styles.brand]}>{t('today.backToToday')}</Text>
                </Pressable>
              )}
              <Text
                accessibilityRole="header"
                style={[isToday ? type.display : type.title, styles.ink]}
              >
                {isToday ? t('today.title') : formatDay(shown, i18n.language)}
              </Text>
            </View>
            {arrow(t('today.previous'), 'M15 6l-6 6 6 6', addDays(shown, -1), false)}
            {arrow(t('today.next'), 'M9 6l6 6-6 6', addDays(shown, 1), shown >= today)}
          </View>
          <Positions.Provider value={(id, y) => positions.current.set(id, y)}>
            {children}
          </Positions.Provider>
          {pending ? (
            next ? (
              <Button
                label={t('today.review', { area: t(`rings.areas.${next}`) })}
                onPress={() => goTo(next)}
              />
            ) : (
              <Text style={[type.heading, styles.done]}>{t('today.reviewDone')}</Text>
            )
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: screenPadding, paddingBottom: tabBarSpace, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, paddingTop: space.md },
  arrow: {
    width: touch,
    height: touch,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { opacity: 0.35 },
  grow: { flex: 1, gap: 2 },
  ink: { color: color.ink },
  soft: { color: color.inkSoft },
  brand: { color: color.blue700 },
  done: { color: color.blue800, textAlign: 'center' },
});
