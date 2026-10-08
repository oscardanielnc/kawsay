import type { LocalDate } from '@kawsay/core/shared/local-date';

/** "miércoles, 7 de octubre": a calendar day read at noon UTC, so no time zone can move it. */
export function formatDay(date: LocalDate, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}
