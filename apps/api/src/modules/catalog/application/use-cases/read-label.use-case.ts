import type { LabelReading } from '@kawsay/contracts/catalog';
import { energyGap, labelPer100g } from '@kawsay/core/food/label-per-100g';
import { Injectable } from '@nestjs/common';
import { Clock } from '../../../../shared/application/ports/clock';
import { LabelLimitError, LabelUnavailableError } from '../../domain/errors';
import { LabelReader, type LabelImage } from '../ports/label-reader';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Label readings per user in any 24 h: a week of shopping fits; a loop does not. */
export const LABEL_DAILY_LIMIT = 30;
/** Printed energy this far from its macronutrients means a misread number (Atwater, ADR 0029). */
export const ENERGY_GAP_RETRY = 0.35;

/**
 * "Leer etiqueta" (F23 piece 3, ADR 0029): the vision model reads the label as printed; the numbers are checked
 * (per-serving values need the serving grams, sub-nutrients cannot exceed their total, energy must agree with the
 * macronutrients) and one corrected retry is allowed. A reading that still fails a check is returned anyway when it is
 * readable: the phone shows every number for the user to confirm, with the warning.
 */
@Injectable()
export class ReadLabelUseCase {
  private readonly calls = new Map<string, number[]>();

  constructor(
    private readonly reader: LabelReader,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, image: LabelImage): Promise<LabelReading> {
    const now = this.clock.now().getTime();
    const recent = (this.calls.get(userId) ?? []).filter((t) => t > now - DAY_MS);
    if (recent.length >= LABEL_DAILY_LIMIT)
      throw new LabelLimitError(new Date(recent[0]! + DAY_MS));

    let used = recent;
    let problems: string[] | undefined;
    let best: LabelReading | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      let reading: LabelReading;
      try {
        reading = await this.reader.read(image, problems);
      } catch {
        continue;
      }
      used = [...used, now];
      this.calls.set(userId, used);
      if (!reading.readable) return reading;
      problems = labelProblems(reading);
      best = reading;
      if (problems.length === 0) return reading;
    }
    if (best) return best;
    throw new LabelUnavailableError();
  }
}

/** What is wrong with a reading, in words the model understands for its retry; empty when it passes. */
export function labelProblems(reading: LabelReading): string[] {
  const v = reading.values;
  const problems: string[] = [];
  if (v.energyKcal === null) problems.push('falta la energía (kcal)');
  if (reading.basis === 'perServing' && reading.servingGrams === null) {
    problems.push('los valores son por porción pero falta el tamaño de la porción en gramos o ml');
  }
  const over = (part: number | null, whole: number | null) =>
    part !== null && whole !== null && part > whole + 0.05;
  if (over(v.saturatedFatG, v.fatG) || over(v.transFatG, v.fatG)) {
    problems.push('la grasa saturada o trans supera a la grasa total');
  }
  if (over(v.sugarsTotalG, v.carbsTotalG) || over(v.fiberG, v.carbsTotalG)) {
    problems.push('los azúcares o la fibra superan a los carbohidratos totales');
  }
  if (over(v.addedSugarG, v.sugarsTotalG))
    problems.push('el azúcar añadido supera a los azúcares totales');
  const per100g =
    reading.basis === 'perServing' && reading.servingGrams === null
      ? null
      : labelPer100g({
          basis: reading.basis,
          servingGrams: reading.servingGrams,
          values: v,
          refinedFlour: false,
        });
  if (per100g) {
    const gap = energyGap(per100g);
    if (gap !== null && gap > ENERGY_GAP_RETRY) {
      problems.push(
        'la energía no cuadra con proteína, grasa y carbohidratos: revisa si tomaste la columna correcta (por 100 g o por porción) y los decimales',
      );
    }
    if ((per100g.energyKcal ?? 0) > 950) {
      problems.push('más de 950 kcal por 100 g es imposible: revisa la columna y los decimales');
    }
  }
  return problems;
}
