import { describe, expect, it } from 'vitest';
import { PushRequest } from './sync';

const weight = {
  id: '01926f3a-8b7c-7def-8123-456789abcdef',
  updatedAt: 1_760_000_000_000,
  deletedAt: null,
  date: '2026-10-09',
  loggedAt: 1_760_000_000_000,
  timeZone: 'America/Lima',
  kg: 80.2,
};

describe('PushRequest', () => {
  it('accepts a record that matches its collection', () => {
    const parsed = PushRequest.parse({ changes: [{ collection: 'weight_entry', record: weight }] });
    expect(parsed.changes[0]?.record).toEqual(weight);
  });

  it('names the field of the record that is wrong', () => {
    const result = PushRequest.safeParse({
      changes: [{ collection: 'weight_entry', record: { ...weight, date: '9/10/2026' } }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['changes', 0, 'record', 'date']);
  });

  it('rejects unknown collections and unknown fields', () => {
    expect(
      PushRequest.safeParse({ changes: [{ collection: 'users', record: weight }] }).success,
    ).toBe(false);
    expect(
      PushRequest.safeParse({
        changes: [{ collection: 'weight_entry', record: { ...weight, extra: 1 } }],
      }).success,
    ).toBe(false);
  });
});
