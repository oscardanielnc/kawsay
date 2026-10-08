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
