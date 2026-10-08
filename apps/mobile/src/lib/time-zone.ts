import { getCalendars } from 'expo-localization';

/** The phone's IANA time zone (ADR 0016); falls back to the JS runtime's when the OS reports none. */
export function deviceTimeZone(): string {
  return getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}
