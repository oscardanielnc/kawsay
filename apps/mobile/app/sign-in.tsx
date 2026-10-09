import { router } from 'expo-router';
import { SignInScreen } from '@/features/account/SignInScreen';
import { useSync } from '@/lib/sync/SyncProvider';

/** First open (F02): after signing in the history is already pulled, so Today or the onboarding follows. */
export default function SignInRoute() {
  const sync = useSync();
  return (
    <SignInScreen
      onSignIn={async (email, password) => {
        const result = await sync.signIn(email, password);
        if (result === 'ok') router.replace('/');
        return result;
      }}
      onUseAlone={() => {
        void sync.useWithoutAccount().then(() => router.replace('/'));
      }}
    />
  );
}
