/** @jest-environment node */
import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { migrationsUpTo, openTestDb } from './test-db';

const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8')) as {
  entries: { tag: string }[];
};

describe('migrations upgrade a phone that already holds data (ADR 0010: they ship over the air)', () => {
  it.each(journal.entries.slice(0, -1).map((entry, i) => [entry.tag, i + 1] as const))(
    'from %s to the latest keeps every weight',
    async (_tag, applied) => {
      const { db, migrateTo } = openTestDb();
      await migrateTo(migrationsUpTo(applied));
      for (let day = 1; day <= 30; day++) {
        const date = `2026-09-${String(day).padStart(2, '0')}`;
        await db.run(
          sql`insert into weight_entry (id, updated_at, date, logged_at, time_zone, kg)
              values (${`w${day}`}, 1, ${date}, 1, 'America/Lima', ${80 - day / 10})`,
        );
      }
      await migrateTo('drizzle');
      const rows = await db.all<{ n: number; total: number }>(
        sql`select count(*) as n, sum(kg) as total from weight_entry`,
      );
      expect(rows[0]).toEqual([30, 2353.5]);
    },
  );

  it('the latest migration set opens an empty database', async () => {
    const { migrateTo } = openTestDb();
    await expect(migrateTo('drizzle')).resolves.toBeUndefined();
  });
});
