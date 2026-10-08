/** A local wall-clock time, `HH:MM` (24 h). */
export type ClockTime = string;

/** Minutes since midnight of a local "HH:MM". */
export function minutesOf(time: ClockTime): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) throw new RangeError(`not a time (HH:MM): ${time}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** The time `minutes` later (or earlier), wrapping around midnight: steppers move times in 15-minute steps. */
export function shiftTime(time: ClockTime, minutes: number): ClockTime {
  const total = (((minutesOf(time) + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
