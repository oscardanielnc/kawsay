import { describe, expect, it } from 'vitest';
import { shouldSuggestUpdate } from './should-suggest-update';

const base = { today: '2026-10-30', loggedDays: [], episodeStarts: [] };

describe('suggest updating the AI summary (F17)', () => {
  it('without a summary yet, suggests one', () => {
    expect(shouldSuggestUpdate({ ...base, lastUpdate: null })).toBe('never');
  });

  it('7 days after the last one, suggests it; 6 days after, not by age', () => {
    expect(shouldSuggestUpdate({ ...base, lastUpdate: '2026-10-23' })).toBe('stale');
    expect(shouldSuggestUpdate({ ...base, lastUpdate: '2026-10-24' })).toBeNull();
  });

  it('4 newly logged days after the last one suggest it; 3 do not', () => {
    const days = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'];
    expect(shouldSuggestUpdate({ ...base, lastUpdate: '2026-10-25', loggedDays: days })).toBe(
      'new-days',
    );
    expect(
      shouldSuggestUpdate({ ...base, lastUpdate: '2026-10-25', loggedDays: days.slice(1) }),
    ).toBeNull();
  });

  it('a symptom episode that started after the last one suggests it', () => {
    expect(
      shouldSuggestUpdate({ ...base, lastUpdate: '2026-10-28', episodeStarts: ['2026-10-29'] }),
    ).toBe('new-episode');
  });
});
