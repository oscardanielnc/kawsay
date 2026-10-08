import { weightTrend, type WeightEntry } from '../body/weight-trend';
import { assertPositive } from '../shared/assert';
import { dayNumber, type LocalDate } from '../shared/local-date';
import { KCAL_PER_KG } from './day-target';

/** Weigh-ins needed inside the window before the estimate is corrected (ADR 0009). */
export const MIN_WEIGH_INS = 14;

/** Days with logged meals, inside counted stretches, needed for a step. */
export const MIN_LOGGED_DAYS = 7;

/** Largest correction of one step: ±10% (ADR 0009). */
export const MAX_STEP = 0.1;

export interface EnergyDay {
  date: LocalDate;
  /** null when the day's meals were not logged. */
  intakeKcal: number | null;
  /** The expenditure the app estimated that day, with the factor it had then. */
  expenditureKcal: number;
}

export interface Recalibration {
  factor: number;
  status: 'recalibrated' | 'not-enough-weights' | 'not-enough-intake';
}

function isLogged(day: EnergyDay | undefined): day is EnergyDay & { intakeKcal: number } {
  return day?.intakeKcal != null;
}

/**
 * Corrects the expenditure factor with the real weight trend (ADR 0009, F09), using only real data.
 * The window is split into stretches between consecutive weigh-ins; a morning weigh-in reflects what was eaten up to
 * the day before, so a stretch covers the days from one weigh-in up to, not including, the next. A stretch counts
 * only when every one of its days has logged meals; skipped stretches drop both their energy and their weight change.
 * The trend uses the whole weight history.
 */
export function recalibrate({
  days,
  weights,
  factor,
}: {
  days: readonly EnergyDay[];
  weights: readonly WeightEntry[];
  factor: number;
}): Recalibration {
  assertPositive({ factor });
  const byDay = new Map(days.map((day) => [dayNumber(day.date), day]));
  const windowDays = [...byDay.keys()];
  const [from, to] = [Math.min(...windowDays), Math.max(...windowDays)];

  const inWindow = weightTrend(weights)
    .map((point) => ({ ...point, day: dayNumber(point.date) }))
    .filter((point) => point.day >= from && point.day <= to);
  if (inWindow.length < MIN_WEIGH_INS) return { factor, status: 'not-enough-weights' };

  let loggedDays = 0;
  let intakeKcal = 0;
  let expenditureKcal = 0;
  let changeKg = 0;
  for (const [i, end] of inWindow.entries()) {
    const start = inWindow[i - 1];
    if (!start) continue;
    const stretch: (EnergyDay | undefined)[] = [];
    for (let day = start.day; day < end.day; day++) stretch.push(byDay.get(day));
    if (!stretch.every(isLogged)) continue;
    for (const energy of stretch) {
      intakeKcal += energy.intakeKcal;
      expenditureKcal += energy.expenditureKcal;
    }
    loggedDays += stretch.length;
    changeKg += end.trendKg - start.trendKg;
  }
  if (loggedDays < MIN_LOGGED_DAYS) return { factor, status: 'not-enough-intake' };

  const realExpenditureKcal = intakeKcal - changeKg * KCAL_PER_KG;
  const step = Math.min(
    Math.max(realExpenditureKcal / expenditureKcal, 1 - MAX_STEP),
    1 + MAX_STEP,
  );
  return { factor: factor * step, status: 'recalibrated' };
}
