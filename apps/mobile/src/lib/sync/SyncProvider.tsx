import Constants from 'expo-constants';
import { addNetworkStateListener } from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import { addDatabaseChangeListener } from 'expo-sqlite';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { useDb } from '../db/DatabaseProvider';
import type { AnalysisRequest, SummaryResponse } from '@kawsay/contracts/insights';
import { createApiClient, type TokenStore } from './api-client';
import { SYNCED_TABLES } from './collections';
import { SyncController, type SyncState } from './sync-controller';

export interface SyncContextValue extends SyncState {
  signIn(email: string, password: string): Promise<'ok' | 'invalid' | 'offline'>;
  useWithoutAccount(): Promise<void>;
  signOut(): Promise<void>;
  syncNow(): Promise<void>;
  /** On-demand AI analysis (F17); needs an account and signal. */
  summarize(request: AnalysisRequest): Promise<SummaryResponse>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

/** Provides a fixed sync state; the routes' tests use it instead of the network. */
export function SyncScope({ value, children }: { value: SyncContextValue; children: ReactNode }) {
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const value = useContext(SyncContext);
  if (!value) throw new Error('useSync() outside <SyncProvider>');
  return value;
}

/** The refresh token in the Android Keystore-backed secure store (ADR 0005). */
const secureTokens: TokenStore = {
  read: () => SecureStore.getItemAsync('kawsay.refreshToken'),
  write: (token) => SecureStore.setItemAsync('kawsay.refreshToken', token),
  clear: () => SecureStore.deleteItemAsync('kawsay.refreshToken'),
};

const SYNCED_TABLE_NAMES = new Set(Object.keys(SYNCED_TABLES));

/** Syncs on open, when the app comes back to the front, when signal returns and a few seconds after writes. */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { db, env } = useDb();
  const [client] = useState(() =>
    createApiClient({
      baseUrl: (Constants.expoConfig?.extra as { apiUrl: string }).apiUrl,
      fetch: globalThis.fetch,
      tokens: secureTokens,
    }),
  );
  const [controller] = useState(() => new SyncController(db, env, client));
  const state = useSyncExternalStore(
    (listener) => controller.subscribe(listener),
    () => controller.current,
  );

  useEffect(() => {
    void controller.start();
    const subscriptions = [
      addNetworkStateListener(({ isInternetReachable }) => {
        if (isInternetReachable) void controller.sync();
      }),
      AppState.addEventListener('change', (next) => {
        if (next === 'active') void controller.sync();
      }),
      addDatabaseChangeListener(({ tableName }) => {
        if (SYNCED_TABLE_NAMES.has(tableName)) controller.schedule();
      }),
    ];
    return () => {
      for (const subscription of subscriptions) subscription.remove();
      controller.stop();
    };
  }, [controller]);

  return (
    <SyncScope
      value={{
        ...state,
        signIn: (email, password) => controller.signIn(email, password),
        useWithoutAccount: () => controller.useWithoutAccount(),
        signOut: () => controller.signOut(),
        syncNow: () => controller.sync(),
        summarize: (request) => client.summarize(request),
      }}
    >
      {children}
    </SyncScope>
  );
}
