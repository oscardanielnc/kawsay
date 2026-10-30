import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/primitives/Button';
import { color, space, type } from '@/lib/theme';
import { SignInForm, type SignInResult } from './SignInForm';

/** First open (F02): sign in, so the history is pulled before anything is created; or use the phone alone. */
export function SignInScreen({
  onSignIn,
  onUseAlone,
}: {
  onSignIn: (email: string, password: string) => Promise<SignInResult>;
  onUseAlone: () => void;
}) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={[type.display, styles.brand]}>
          {t('account.welcomeTitle')}
        </Text>
        <Text style={[type.body, styles.ink]}>{t('account.welcomeBody')}</Text>
        <SignInForm onSignIn={onSignIn} />
        <Button variant="link" label={t('account.useAlone')} onPress={onUseAlone} />
        <Text style={[type.caption, styles.muted]}>{t('account.useAloneHint')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface2 },
  content: { padding: space.xl, gap: space.lg, flexGrow: 1, justifyContent: 'center' },
  brand: { color: color.blue700 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted, textAlign: 'center' },
});
