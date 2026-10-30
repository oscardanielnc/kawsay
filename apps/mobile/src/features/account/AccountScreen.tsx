import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/layout/GradientBackground';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { formatMoment } from '@/lib/format';
import type { SyncStatus } from '@/lib/sync/sync-controller';
import { color, space, type } from '@/lib/theme';
import { SignInForm, type SignInResult } from './SignInForm';

interface Props {
  account: { email: string; lastSyncedAt: number | null } | null;
  status: SyncStatus;
  pending: number;
  timeZone: string;
  onSignIn: (email: string, password: string) => Promise<SignInResult>;
  onSyncNow: () => void;
  onSignOut: () => void;
}

/** Account and sync (F02): who is signed in, whether everything is on the server, sign in or out. */
export function AccountScreen({
  account,
  status,
  pending,
  timeZone,
  onSignIn,
  onSyncNow,
  onSignOut,
}: Props) {
  const { t } = useTranslation();

  const statusLine = () => {
    if (status === 'syncing') return t('account.syncing');
    if (status === 'offline') return t('account.offlineStatus');
    if (status === 'error') return t('account.error');
    if (!account?.lastSyncedAt) return t('account.neverSynced');
    return t('account.synced', { when: formatMoment(account.lastSyncedAt, timeZone) });
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={[type.title, styles.ink]}>
            {t('account.title')}
          </Text>
          {account ? (
            <>
              <Card>
                <Text style={[type.heading, styles.ink]}>
                  {t('account.signedInAs', { email: account.email })}
                </Text>
                <Text style={[type.body, styles.ink]}>{statusLine()}</Text>
                <Text style={[type.body, styles.muted]}>
                  {pending > 0 ? t('account.pending', { count: pending }) : t('account.upToDate')}
                </Text>
              </Card>
              <Button
                label={t('account.syncNow')}
                disabled={status === 'syncing'}
                onPress={onSyncNow}
              />
              <Button variant="secondary" label={t('account.signOut')} onPress={onSignOut} />
              <Text style={[type.caption, styles.muted]}>{t('account.signOutHint')}</Text>
            </>
          ) : (
            <>
              {status === 'session-ended' ? (
                <Text accessibilityRole="alert" style={[type.body, styles.warning]}>
                  {t('account.sessionEnded')}
                </Text>
              ) : null}
              <Text style={[type.body, styles.ink]}>{t('account.localBody')}</Text>
              <SignInForm onSignIn={onSignIn} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: space.lg, gap: space.md },
  ink: { color: color.ink },
  muted: { color: color.inkSoft },
  warning: { color: color.amber800 },
});
