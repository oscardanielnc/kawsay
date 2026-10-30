import type { Fib4Band } from '@kawsay/core/liver/fib4';
import type { weekSugar } from '@kawsay/core/liver/week-sugar';
import type { LocalDate } from '@kawsay/core/shared/local-date';
import type { Tone } from '@kawsay/core/shared/tone';

/** A tile of the Liver card: value and its zone, or null for "sin dato". */
export interface LiverTile {
  value: number | null;
  zone: Tone | null;
}

export interface LiverWeek {
  from: LocalDate;
  to: LocalDate;
  sugar: ReturnType<typeof weekSugar> & { dates: LocalDate[] };
  sugaryDrinks: { count: number; zone: Tone };
  movement: LiverTile;
  strengthDays: LiverTile;
  /** Grams in the week; `unknown` counts alcoholic drinks logged without a kind (older entries). */
  alcohol: LiverTile & { unknown: number };
  sleep: LiverTile;
  waistRatio: LiverTile;
  /** Trend change over four weeks, kg (negative = lost), with the goal's direction for its zone. */
  weightChange: LiverTile;
  fib4: { value: number; band: Fib4Band; date: LocalDate } | null;
  /** Sugar block and the six tiles in blue. */
  inRange: number;
}
