import { describe, expect, it } from 'vitest';
import { addDays } from '../shared/local-date';
import { symptomEpisodes } from './symptom-episodes';

const start = '2026-10-01';
const days = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => addDays(start, from + i));

describe('symptom episodes (F13)', () => {
  it('A symptom marked 10 days in a row shows as one episode of 10 days', () => {
    expect(symptomEpisodes(days(0, 10))).toEqual([{ start, end: addDays(start, 9), days: 10 }]);
  });

  it('a day without the symptom splits two episodes', () => {
    expect(symptomEpisodes([...days(0, 2), ...days(3, 1)])).toEqual([
      { start, end: addDays(start, 1), days: 2 },
      { start: addDays(start, 3), end: addDays(start, 3), days: 1 },
    ]);
  });

  it('order and repeated days do not matter', () => {
    expect(symptomEpisodes([addDays(start, 1), start, start])).toEqual([
      { start, end: addDays(start, 1), days: 2 },
    ]);
  });

  it('no days, no episodes', () => {
    expect(symptomEpisodes([])).toEqual([]);
  });
});
