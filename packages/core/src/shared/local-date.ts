/** A calendar day in the user's time zone, `YYYY-MM-DD`. */
export type LocalDate = string;

const MS_PER_DAY = 86_400_000;

/** Days since 1970-01-01 for a calendar day; UTC arithmetic so time zones and DST never shift it. */
export function dayNumber(date: LocalDate): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const ms = match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : NaN;
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== date) {
    throw new RangeError(`not a calendar date (YYYY-MM-DD): ${date}`);
  }
  return ms / MS_PER_DAY;
}

/**
 * The calendar day of an instant in a time zone (IANA name from the phone, e.g. `America/Lima`). Entries store this
 * date when they are logged, so a dinner at 22:00 in Lima belongs to that day even though UTC has moved on (ADR 0016).
 */
export function localDateOf(instant: Date, timeZone: string): LocalDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function fromDayNumber(day: number): LocalDate {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/** The calendar day `days` after (or before, if negative) `date`. */
export function addDays(date: LocalDate, days: number): LocalDate {
  return fromDayNumber(dayNumber(date) + days);
}

/** Calendar days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return dayNumber(to) - dayNumber(from);
}

/** Day of the week, Monday = 0 … Sunday = 6 (calendar rows start on Monday in Peru). */
export function weekday(date: LocalDate): number {
  return (((dayNumber(date) + 3) % 7) + 7) % 7;
}

/** A calendar month, `YYYY-MM`. */
export type LocalMonth = string;

/** Every day of a month, in order. */
export function monthDays(month: LocalMonth): LocalDate[] {
  const first = `${month}-01`;
  const days: LocalDate[] = [];
  for (let date = first; date.startsWith(month); date = addDays(date, 1)) days.push(date);
  if (days.length === 0) throw new RangeError(`not a month (YYYY-MM): ${month}`);
  return days;
}

/** The month `months` after (or before) `month`. */
export function addMonths(month: LocalMonth, months: number): LocalMonth {
  dayNumber(`${month}-01`);
  const index = Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1 + months;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/** Monday of the week `date` falls in: weekly entries (waist, F04) are keyed by it. */
export function weekStart(date: LocalDate): LocalDate {
  return addDays(date, -weekday(date));
}
