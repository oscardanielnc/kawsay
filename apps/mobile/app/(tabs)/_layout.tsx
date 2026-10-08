import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getProfile } from '@/features/profile/profile-db';
import { useDb } from '@/lib/db/DatabaseProvider';
import { useLoad } from '@/lib/use-load';
import { useCallback } from 'react';

/** N1 navigation (design/direction.md): Today · Calendar · (+) · Insights · Profile. */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { db } = useDb();
  const { data: profile } = useLoad(useCallback(() => getProfile(db), [db]));
  if (profile === undefined) return null;
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
