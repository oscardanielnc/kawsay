import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/primitives/Button';
import { color, radius, space, type } from '@/lib/theme';

export type SignInResult = 'ok' | 'invalid' | 'offline';

/** Email and password; says why a sign-in failed. */
export function SignInForm({
  onSignIn,
}: {
  onSignIn: (email: string, password: string) => Promise<SignInResult>;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Exclude<SignInResult, 'ok'> | null>(null);

  const submit = async () => {
    setBusy(true);
    setProblem(null);
    const result = await onSignIn(email.trim(), password);
    setBusy(false);
    if (result !== 'ok') setProblem(result);
  };

  return (
    <View style={styles.form}>
      <TextInput
        accessibilityLabel={t('account.email')}
        placeholder={t('account.email')}
        placeholderTextColor={color.inkMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        style={[type.body, styles.input]}
      />
      <TextInput
        accessibilityLabel={t('account.password')}
        placeholder={t('account.password')}
        placeholderTextColor={color.inkMuted}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoComplete="current-password"
        secureTextEntry
        style={[type.body, styles.input]}
      />
      {problem ? (
        <Text accessibilityRole="alert" style={[type.body, styles.problem]}>
          {t(`account.${problem}`)}
        </Text>
      ) : null}
      <Button
        label={busy ? t('account.signingIn') : t('account.signIn')}
        disabled={busy || !email.includes('@') || password.length === 0}
        onPress={() => void submit()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.md },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.chip,
    paddingHorizontal: space.md,
    color: color.ink,
    backgroundColor: color.card,
  },
  problem: { color: color.coral800 },
});
