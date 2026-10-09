import type { Change } from '@kawsay/contracts/sync';
import { describe, expect, it } from 'vitest';
import { newestPerRecord } from './push-changes.use-case';

const change = (id: string, updatedAt: number, kg: number): Change => ({
  collection: 'weight_entry',
  record: {
    id,
    updatedAt,
    deletedAt: null,
    date: '2026-10-09',
    loggedAt: 0,
    timeZone: 'America/Lima',
    kg,
  },
});

describe('newestPerRecord', () => {
  it('keeps the latest edit when a push carries the same record twice', () => {
    const a = '01926f3a-8b7c-7def-8123-000000000001';
    const b = '01926f3a-8b7c-7def-8123-000000000002';
    const kept = newestPerRecord([change(a, 2, 80), change(b, 1, 70), change(a, 5, 79)]);
    expect(kept.map((c) => c.record)).toEqual([
      expect.objectContaining({ id: a, kg: 79 }),
      expect.objectContaining({ id: b, kg: 70 }),
    ]);
  });
});
