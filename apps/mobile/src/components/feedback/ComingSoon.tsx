import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Placeholder for a tab whose feature is not built yet. */
export function ComingSoon({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.body}>{t('common.comingSoon')}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F2E8', paddingHorizontal: 16 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: '#1C1F1A' },
  body: { fontSize: 15, lineHeight: 22, color: '#5E6358' },
});
