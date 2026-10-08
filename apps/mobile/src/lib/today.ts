import { localDateOf, type LocalDate } from '@kawsay/core/shared/local-date';
import { deviceTimeZone } from './time-zone';

/** Today's calendar day on this phone (ADR 0016). */
export function today(): LocalDate {
  return localDateOf(new Date(), deviceTimeZone());
}
