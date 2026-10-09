import { AccountScreen } from '@/features/account/AccountScreen';
import { useSync } from '@/lib/sync/SyncProvider';
import { deviceTimeZone } from '@/lib/time-zone';

/** Profile → Account and sync (F02). */
export default function AccountRoute() {
  const sync = useSync();
  const account = sync.account?.kind === 'signed-in' ? sync.account : null;
  return (
    <AccountScreen
      account={account}
      status={sync.status}
      pending={sync.pending}
      timeZone={deviceTimeZone()}
      onSignIn={(email, password) => sync.signIn(email, password)}
      onSyncNow={() => void sync.syncNow()}
      onSignOut={() => void sync.signOut()}
    />
  );
}
