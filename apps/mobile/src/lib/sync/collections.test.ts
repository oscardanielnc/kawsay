import { COLLECTIONS, RECORD_SCHEMAS } from '@kawsay/contracts/records';
import { getTableColumns } from 'drizzle-orm';
import { SYNCED_TABLES } from './collections';

describe('synced collections', () => {
  it.each(COLLECTIONS)(
    '%s: the server contract lists the same fields as the phone table',
    (collection) => {
      const phone = Object.keys(getTableColumns(SYNCED_TABLES[collection])).sort();
      const server = Object.keys(RECORD_SCHEMAS[collection].shape).sort();
      expect(server).toEqual(phone);
    },
  );
});
