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
  await migrate(
    db,
    (queries) => {
      for (const query of queries) sqlite.exec(query);
      return Promise.resolve();
    },
    { migrationsFolder: 'drizzle' },
  );
  return db;
}
