import { daysBetween, type LocalDate } from '../shared/local-date';

/** F17 redesign: suggest a new summary after this many days, or this many newly logged days. */
const STALE_DAYS = 7;
const NEW_LOGGED_DAYS = 4;

export type SuggestReason = 'never' | 'stale' | 'new-days' | 'new-episode';

/**
 * Whether the AI summary card suggests updating (F17): never updated, 7 days since the last one, 4 days logged after
 * it, or a symptom episode that started after it. The AI is still only called when the user taps the button.
 */
export function shouldSuggestUpdate({
  today,
  lastUpdate,
  loggedDays,
  episodeStarts,
}: {
  today: LocalDate;
  /** Day of the last summary; null when there is none. */
  lastUpdate: LocalDate | null;
  /** Days with something logged. */
  loggedDays: readonly LocalDate[];
  /** First days of the user's symptom episodes. */
  episodeStarts: readonly LocalDate[];
}): SuggestReason | null {
  if (lastUpdate === null) return 'never';
  if (daysBetween(lastUpdate, today) >= STALE_DAYS) return 'stale';
  if (loggedDays.filter((d) => d > lastUpdate).length >= NEW_LOGGED_DAYS) return 'new-days';
  if (episodeStarts.some((d) => d > lastUpdate)) return 'new-episode';
  return null;
}
