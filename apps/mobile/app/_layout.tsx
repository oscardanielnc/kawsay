import '@/lib/i18n';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScreenError } from '@/components/feedback/ScreenError';
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

/** A screen that fails to render shows a way out instead of closing the app. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ScreenError error={error} retry={retry} />;
}
