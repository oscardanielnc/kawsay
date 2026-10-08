import catalog from '@kawsay/catalog/catalog.json';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { getRandomBytes } from 'expo-crypto';
import { openDatabaseSync } from 'expo-sqlite';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import migrations from '../../../drizzle/migrations';
import { loadCatalog, type BundledCatalog } from './catalog';
import * as schema from './schema';
import type { Db, RecordEnv } from './types';

const sqlite = openDatabaseSync('kawsay.db', { enableChangeListener: true });
const db = drizzle(sqlite, { schema }) as unknown as Db;
const env: RecordEnv = { now: () => Date.now(), randomBytes: (count) => getRandomBytes(count) };

const DatabaseContext = createContext<{ db: Db; env: RecordEnv } | null>(null);

/** The local database for screens and hooks; only available under <DatabaseProvider>. */
export function useDb(): { db: Db; env: RecordEnv } {
  const value = useContext(DatabaseContext);
  if (!value) throw new Error('useDb() outside <DatabaseProvider>');
  return value;
}

/**
 * Opens the local database, applies pending migrations and refreshes the catalog before showing the app. On failure
 * it stops there and says so, instead of running on a half-migrated database.
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const migrated = useMigrations(db as never, migrations);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState<Error | null>(null);

  useEffect(() => {
    if (!migrated.success) return;
    loadCatalog(db, catalog as unknown as BundledCatalog).then(
      () => setCatalogReady(true),
      (error: unknown) => setCatalogError(error instanceof Error ? error : new Error(String(error))),
    );
  }, [migrated.success]);

  const error = migrated.error ?? catalogError;
  if (error) {
    return (
      <View style={styles.screen}>
        <Text accessibilityRole="header" style={styles.title}>
          {t('db.errorTitle')}
        </Text>
        <Text style={styles.body}>{t('db.errorBody')}</Text>
        <Text style={styles.detail}>{error.message}</Text>
      </View>
    );
  }
  if (!migrated.success || !catalogReady) return null;
  return <DatabaseContext.Provider value={{ db, env }}>{children}</DatabaseContext.Provider>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F2E8', padding: 24, justifyContent: 'center', gap: 8 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: '#B3392F' },
  body: { fontSize: 15, lineHeight: 22, color: '#1C1F1A' },
  detail: { fontSize: 12, lineHeight: 16, color: '#5E6358' },
});
