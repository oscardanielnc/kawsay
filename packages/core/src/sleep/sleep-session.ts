import { minutesOf, type ClockTime } from '../shared/clock-time';
import { addDays, dayNumber, type LocalDate } from '../shared/local-date';

export type SleepKind = 'night' | 'nap';

/** A sleep session on the clock: what the steppers edit. */
export interface ClockSession {
  kind: SleepKind;
  start: ClockTime;
  end: ClockTime;
}

/** A sleep session as stored: local wall-clock stamps `YYYY-MM-DDTHH:MM` (F11). */
export interface SleepStamps {
  start: string;
  end: string;
}

const NOON = 12 * 60;
const DAY_HOURS = 24;

/**
 * A night that starts in the evening and ends earlier on the clock crossed midnight. A nap never does, and neither
 * does a "night" that starts in the morning: an end before the start there is a time still being entered.
 */
function crossesMidnight({ kind, start, end }: ClockSession): boolean {
  const from = minutesOf(start);
  return kind === 'night' && from >= NOON && from > minutesOf(end);
}

/** Full stamps for a session that counts for `date` (the day you woke up). */
export function sessionStamps(date: LocalDate, session: ClockSession): SleepStamps {
  const startDay = crossesMidnight(session) ? addDays(date, -1) : date;
  return { start: `${startDay}T${session.start}`, end: `${date}T${session.end}` };
}

/** Hours on the clock, with the same midnight rule as the stamps; an unfinished entry counts 0 (F11). */
export function clockHours(session: ClockSession): number {
  const minutes = minutesOf(session.end) - minutesOf(session.start);
  return Math.max(0, crossesMidnight(session) ? minutes + 1440 : minutes) / 60;
}

function minutesSinceEpoch(stamp: string): number {
  const [date = '', time = ''] = stamp.split('T');
  return dayNumber(date) * 1440 + minutesOf(time);
}

/**
 * Hours between the stamps; wall-clock arithmetic, so a DST change does not bend a night. An end before the start
 * is a time still being entered: 0 hours until it is fixed.
 */
export function sessionHours({ start, end }: SleepStamps): number {
  return Math.max(0, minutesSinceEpoch(end) - minutesSinceEpoch(start)) / 60;
}

/** Night and naps add up per day (F11); a day never holds more than 24 hours, even with overlapping entries. */
export function daySleepHours(sessions: readonly SleepStamps[]): number {
  return Math.min(
    DAY_HOURS,
    sessions.reduce((sum, session) => sum + sessionHours(session), 0),
  );
}
