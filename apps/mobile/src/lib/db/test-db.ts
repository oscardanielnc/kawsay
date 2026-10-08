import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { migrate } from 'drizzle-orm/sqlite-proxy/migrator';
import * as schema from './schema';
import type { Db } from './types';

/**
 * In-memory SQLite for tests: Node's built-in driver behind Drizzle's proxy, migrated with the same `.sql` files
 * the app bundles. Only for Jest (node environment).
 */
export async function createTestDb(): Promise<Db> {
  const { db, migrateTo } = openTestDb();
  await migrateTo('drizzle');
  return db;
}

/** The migrations folder cut after its first `count` migrations: a phone still on an older version. */
export function migrationsUpTo(count: number): string {
  const folder = mkdtempSync(join(tmpdir(), 'kawsay-migrations-'));
  cpSync('drizzle', folder, { recursive: true });
  const journalPath = join(folder, 'meta', '_journal.json');
  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as { entries: unknown[] };
  writeFileSync(
    journalPath,
    JSON.stringify({ ...journal, entries: journal.entries.slice(0, count) }),
  );
  return folder;
}

/** A database that can be migrated step by step, to test upgrades of databases that already hold data. */
export function openTestDb(): { db: Db; migrateTo: (folder: string) => Promise<void> } {
  const sqlite = new DatabaseSync(':memory:');
  const run = (sql: string, params: unknown[], method: 'run' | 'all' | 'values' | 'get') => {
    const statement = sqlite.prepare(sql);
    if (method === 'run') {
      statement.run(...(params as never[]));
      return { rows: [] };
    }
    statement.setReturnArrays(true);
    const rows = statement.all(...(params as never[])) as unknown as unknown[][];
    return { rows: method === 'get' ? (rows[0] ?? []) : rows };
  };
  const db = drizzle((sql, params, method) => Promise.resolve(run(sql, params, method)), {
    schema,
  });
  const migrateTo = (migrationsFolder: string) =>
    migrate(
      db,
      (queries) => {
        for (const query of queries) sqlite.exec(query);
        return Promise.resolve();
      },
      { migrationsFolder },
    );
  return { db, migrateTo };
}
