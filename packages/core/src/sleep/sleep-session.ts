import { minutesOf, type ClockTime } from '../shared/clock-time';
import { addDays, dayNumber, type LocalDate } from '../shared/local-date';

/** A sleep session as stored: local wall-clock stamps `YYYY-MM-DDTHH:MM` (F11). */
export interface SleepStamps {
  start: string;
  end: string;
}

/**
 * Full stamps for a session that counts for `date` (the day you woke up). A start later than the end crossed midnight,
 * so it belongs to the evening before.
 */
export function sessionStamps(
  date: LocalDate,
  { start, end }: { start: ClockTime; end: ClockTime },
): SleepStamps {
  const startDay = minutesOf(start) > minutesOf(end) ? addDays(date, -1) : date;
  return { start: `${startDay}T${start}`, end: `${date}T${end}` };
}

function minutesSinceEpoch(stamp: string): number {
  const [date = '', time = ''] = stamp.split('T');
  return dayNumber(date) * 1440 + minutesOf(time);
}

/** Hours between the stamps; wall-clock arithmetic, so a DST change does not bend a night. */
export function sessionHours({ start, end }: SleepStamps): number {
  const minutes = minutesSinceEpoch(end) - minutesSinceEpoch(start);
  if (minutes < 0) throw new RangeError(`sleep ends before it starts: ${start} → ${end}`);
  return minutes / 60;
}

/** Night and naps add up per day (F11). */
export function daySleepHours(sessions: readonly SleepStamps[]): number {
  return sessions.reduce((sum, session) => sum + sessionHours(session), 0);
}
