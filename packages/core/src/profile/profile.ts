import type { ClockTime } from '../shared/clock-time';
import { dayNumber, daysBetween, type LocalDate } from '../shared/local-date';
import { clockHours } from '../sleep/sleep-session';

/**
 * The age entered in onboarding, aged by the full years since the day it was entered (F01), so the BMR keeps up
 * without asking again.
 */
export function ageOn({
  ageYears,
  ageSetOn,
  today,
}: {
  ageYears: number;
  ageSetOn: LocalDate;
  today: LocalDate;
}): number {
  dayNumber(ageSetOn); // throws on a malformed date
  dayNumber(today);
  const years = Number(today.slice(0, 4)) - Number(ageSetOn.slice(0, 4));
  const beforeAnniversary = today.slice(5) < ageSetOn.slice(5);
  return ageYears + Math.max(0, years - (beforeAnniversary ? 1 : 0));
}

/**
 * Hours of the usual night plus the optional nap, with the session rules (F11): a night that crosses midnight counts
 * through it, an unfinished nap counts 0, and the total stays within a day.
 */
export function sleepHours(
  night: { start: ClockTime; end: ClockTime },
  nap?: { start: ClockTime; end: ClockTime } | null,
): number {
  const hours =
    clockHours({ kind: 'night', ...night }) + (nap ? clockHours({ kind: 'nap', ...nap }) : 0);
  return Math.min(24, hours);
}

/**
 * kg per week still needed to reach the goal by its date. Maintaining, a goal already reached, or a date already
 * past give 0: the target then has no deficit (F09).
 */
export function goalKgPerWeek({
  currentKg,
  goalKg,
  today,
  goalDate,
}: {
  currentKg: number;
  goalKg: number | null;
  today: LocalDate;
  goalDate: LocalDate | null;
}): number {
  if (goalKg === null || goalDate === null) return 0;
  const weeks = daysBetween(today, goalDate) / 7;
  const toLose = goalKg - currentKg;
  if (weeks <= 0 || toLose >= 0) return 0;
  return toLose / weeks;
}
