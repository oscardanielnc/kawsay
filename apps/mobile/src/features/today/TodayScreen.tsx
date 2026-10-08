import { localDateOf } from '@kawsay/core/shared/local-date';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, space, type } from '@/lib/theme';
import { formatDay } from './format-day';

interface Props {
  /** Injected clock and zone (ADR 0016); the route passes the real ones. */
  now: Date;
  timeZone: string;
  /** Sections composed by the route from other features (meals, activity…). */
  children?: ReactNode;
}

export function TodayScreen({ now, timeZone, children }: Props) {
  const { t, i18n } = useTranslation();
  const today = localDateOf(now, timeZone);
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text accessibilityRole="header" style={[type.title, styles.ink]}>
            {t('today.title')}
          </Text>
          <Text style={[type.body, styles.muted]}>{formatDay(today, i18n.language)}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, gap: space.md },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
