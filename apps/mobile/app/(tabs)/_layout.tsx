import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getProfile } from '@/features/profile/profile-db';
import { useDb } from '@/lib/db/DatabaseProvider';
import { useSync } from '@/lib/sync/SyncProvider';
import { useLoad } from '@/lib/use-load';
import { useCallback, useEffect } from 'react';

/** N1 navigation (design/direction.md): Today · Calendar · (+) · Insights · Profile. */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { db } = useDb();
  const { account } = useSync();
  const { data: profile, reload } = useLoad(useCallback(() => getProfile(db), [db]));
  // Re-read after sign-in: the pulled history may already hold the profile.
  useEffect(() => reload(), [account?.kind, reload]);
  if (account === undefined || profile === undefined) return null;
  // First open (F02): sign in before onboarding, so a second phone gets the profile instead of a new one.
  if (account.kind === 'undecided') return <Redirect href="/sign-in" />;
  if (profile === null) return <Redirect href="/onboarding" />;
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1F4D3A' }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.today') }} />
      <Tabs.Screen name="calendar" options={{ title: t('tabs.calendar') }} />
      <Tabs.Screen name="log" options={{ title: t('tabs.log') }} />
      <Tabs.Screen name="insights" options={{ title: t('tabs.insights') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
