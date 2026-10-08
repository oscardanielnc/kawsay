import { weightTrend, type WeightEntry } from '../body/weight-trend';
import { assertPositive } from '../shared/assert';
import { dayNumber, type LocalDate } from '../shared/local-date';
import { KCAL_PER_KG } from './day-target';

/** Weigh-ins needed inside the window before the estimate is corrected (ADR 0009). */
export const MIN_WEIGH_INS = 14;

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
  status: 'recalibrated' | 'not-enough-weights' | 'missing-intake';
}

/**
 * Corrects the expenditure factor with the real weight trend (ADR 0009, F09).
 * A morning weigh-in reflects what was eaten up to the day before, so the energy balance covers the days from the
 * first weigh-in of the window up to, not including, the last one. The trend uses the whole weight history.
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

  const inWindow = weightTrend(weights).filter((point) => {
    const day = dayNumber(point.date);
    return day >= from && day <= to;
  });
  const start = inWindow[0];
  const end = inWindow.at(-1);
  if (!start || !end || inWindow.length < MIN_WEIGH_INS) {
    return { factor, status: 'not-enough-weights' };
  }

  let intakeKcal = 0;
  let expenditureKcal = 0;
  for (let day = dayNumber(start.date); day < dayNumber(end.date); day++) {
    const energy = byDay.get(day);
    if (energy?.intakeKcal == null) return { factor, status: 'missing-intake' };
    intakeKcal += energy.intakeKcal;
    expenditureKcal += energy.expenditureKcal;
  }

  const realExpenditureKcal = intakeKcal - (end.trendKg - start.trendKg) * KCAL_PER_KG;
  const step = Math.min(
    Math.max(realExpenditureKcal / expenditureKcal, 1 - MAX_STEP),
    1 + MAX_STEP,
  );
  return { factor: factor * step, status: 'recalibrated' };
}
