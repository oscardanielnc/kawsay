import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, screenPadding, type } from '@/lib/theme';

/** Placeholder for a tab whose feature is not built yet. */
export function ComingSoon({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.screen}>
      <Text accessibilityRole="header" style={[type.display, styles.ink]}>
        {title}
      </Text>
      <Text style={[type.body, styles.soft]}>{t('common.comingSoon')}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface2, paddingHorizontal: screenPadding },
  ink: { color: color.ink },
  soft: { color: color.inkSoft },
});
