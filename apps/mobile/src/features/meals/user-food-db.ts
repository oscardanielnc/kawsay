import { labelPer100g, type LabelValues } from '@kawsay/core/food/label-per-100g';
import type { LocalDate } from '@kawsay/core/shared/local-date';
import { eq } from 'drizzle-orm';
import { newRecord } from '@/lib/db/record';
import { userFood } from '@/lib/db/schema';
import type { Db, RecordEnv } from '@/lib/db/types';

/** A food from its label, as the form confirms it (F23 piece 3). */
export interface NewUserFood {
  name: string;
  brand: string | null;
  label: LabelValues;
  /** One serving in the label's words ("6 galletas"); its grams are `label.servingGrams`. */
  servingLabel: string | null;
  packageGrams: number | null;
  isDrink: boolean;
  /** The numbers came from a photo read by the API (and were confirmed by the user). */
  readByAi: boolean;
  /** The local day the label was entered. */
  labelDate: LocalDate;
}

/** Saves a label food with its numbers per 100 g; it is offered right away in meals and Create dish. */
export async function saveUserFood(
  db: Db,
  env: RecordEnv,
  input: NewUserFood,
): Promise<{ id: string }> {
  const name = input.name.trim();
  if (!name) throw new Error('a label food needs a name');
  const per100g = labelPer100g(input.label);
  if (per100g.energyKcal === null) throw new Error('a label food needs its energy');
  const servingGrams = input.label.servingGrams;
  const record = newRecord(env);
  await db.insert(userFood).values({
    ...record,
    name,
    brand: input.brand?.trim() || null,
    per100g,
    servingLabel: servingGrams ? input.servingLabel?.trim() || null : null,
    servingGrams: servingGrams && servingGrams > 0 ? servingGrams : null,
    packageGrams: input.packageGrams && input.packageGrams > 0 ? input.packageGrams : null,
    isDrink: input.isDrink,
    refinedFlour: input.label.refinedFlour,
    labelDate: input.labelDate,
    readByAi: input.readByAi,
  });
  return { id: record.id };
}

/** Removes a label food (tombstone, ADR 0004); entries already logged with it keep nothing to show. */
export async function deleteUserFood(db: Db, env: RecordEnv, id: string): Promise<void> {
  const now = env.now();
  await db.update(userFood).set({ deletedAt: now, updatedAt: now }).where(eq(userFood.id, id));
}

/** The household units of a label food: its serving, then the whole package. */
export function userFoodUnits(row: {
  servingLabel: string | null;
  servingGrams: number | null;
  packageGrams: number | null;
  isDrink: boolean;
}): { label: string; grams: number }[] {
  const units: { label: string; grams: number }[] = [];
  const unit = row.isDrink ? 'ml' : 'g';
  if (row.servingGrams) {
    units.push({
      label: `${row.servingLabel ?? '1 porción'} (${round(row.servingGrams)} ${unit})`,
      grams: row.servingGrams,
    });
  }
  if (row.packageGrams && row.packageGrams !== row.servingGrams) {
    units.push({ label: `1 envase (${round(row.packageGrams)} ${unit})`, grams: row.packageGrams });
  }
  return units;
}

const round = (n: number) => Math.round(n * 10) / 10;
