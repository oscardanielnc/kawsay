/** Numbers and dates are formatted for Peru (ADR 0006): "27.7", "2,393", "31 dic. 2026". */
export const FORMAT_LOCALE = 'es-PE';

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString(FORMAT_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** A calendar day as "31 dic. 2026", read at noon UTC so no time zone moves it. */
export function formatShortDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(FORMAT_LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
