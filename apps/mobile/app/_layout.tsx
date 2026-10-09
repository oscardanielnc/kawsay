import '@/lib/i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DatabaseProvider } from '@/lib/db/DatabaseProvider';
import { SyncProvider } from '@/lib/sync/SyncProvider';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <DatabaseProvider>
        <SyncProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SyncProvider>
      </DatabaseProvider>
    </>
  );
}
