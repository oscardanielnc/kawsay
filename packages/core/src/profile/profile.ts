import { minutesOf } from '../shared/clock-time';
import { dayNumber, daysBetween, type LocalDate } from '../shared/local-date';

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

function spanMinutes({ start, end }: { start: string; end: string }): number {
  const minutes = minutesOf(end) - minutesOf(start);
  return minutes <= 0 ? minutes + 24 * 60 : minutes;
}

/** Hours of the usual night plus the optional nap; a night that crosses midnight counts through it. */
export function sleepHours(
  night: { start: string; end: string },
  nap?: { start: string; end: string } | null,
): number {
  return (spanMinutes(night) + (nap ? spanMinutes(nap) : 0)) / 60;
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
