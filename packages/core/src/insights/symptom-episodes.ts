import { dayNumber, type LocalDate } from '../shared/local-date';

/** Consecutive days with a symptom: one episode (F13). */
export interface SymptomEpisode {
  start: LocalDate;
  end: LocalDate;
  days: number;
}

/**
 * Groups the days a symptom was marked into episodes of consecutive days. Insights look for triggers on each
 * episode's first day (the days after it only say it is still there) and use its length for what makes it last.
 */
export function symptomEpisodes(present: readonly LocalDate[]): SymptomEpisode[] {
  const sorted = [...new Set(present)].sort();
  const episodes: SymptomEpisode[] = [];
  for (const date of sorted) {
    const last = episodes.at(-1);
    if (last && dayNumber(date) - dayNumber(last.end) === 1) {
      last.end = date;
      last.days += 1;
    } else {
      episodes.push({ start: date, end: date, days: 1 });
    }
  }
  return episodes;
}
