import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/primitives/Button';
import { color, space, type } from '@/lib/theme';

interface Props {
  error: Error;
  retry: () => Promise<void>;
}

/** What a screen shows instead of closing the app when it fails to render: retry, or go back to today. */
export function ScreenError({ error, retry }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={[type.title, styles.title]}>
        {t('screenError.title')}
      </Text>
      <Text style={[type.body, styles.ink]}>{t('screenError.body')}</Text>
      <Text style={[type.caption, styles.muted]}>{error.message}</Text>
      <Button label={t('screenError.retry')} onPress={() => void retry()} />
      <Button
        variant="secondary"
        label={t('screenError.today')}
        onPress={() => {
          router.replace('/');
          void retry();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
    padding: space.xl,
    justifyContent: 'center',
    gap: space.md,
  },
  title: { color: color.dangerText },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
