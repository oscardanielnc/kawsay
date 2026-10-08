import { localDateOf } from '@kawsay/core/shared/local-date';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDay } from './format-day';

interface Props {
  /** Injected clock and zone (ADR 0016); the route passes the real ones. */
  now: Date;
  timeZone: string;
}

export function TodayScreen({ now, timeZone }: Props) {
  const { t, i18n } = useTranslation();
  const today = localDateOf(now, timeZone);
  return (
    <SafeAreaView style={styles.screen}>
      <View>
        <Text accessibilityRole="header" style={styles.title}>
          {t('today.title')}
        </Text>
        <Text style={styles.date}>{formatDay(today, i18n.language)}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F2E8', paddingHorizontal: 16 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: '#1C1F1A' },
  date: { fontSize: 15, lineHeight: 22, color: '#5E6358' },
});
