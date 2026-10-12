import { describe, expect, it } from 'vitest';
import { weeklyNutrients, type NutrientDay } from './weekly-nutrients';

const man25 = { sex: 'male' as const, ageYears: 25 };
/** A day of 2 meals whose single food brings `per100g` in 100 g. */
const dayWith = (per100g: Record<string, number | null>, targetKcal = 2000): NutrientDay => ({
  meals: 2,
  targetKcal,
  entries: [{ grams: 100, per100g }],
});
const week = (per100g: Record<string, number | null>, days = 7, targetKcal = 2000) =>
  Array.from({ length: days }, () => dayWith(per100g, targetKcal));

describe('weekly nutrients (F19)', () => {
  it('A week averaging 6 mg of iron for a 25-year-old man shows 75% in yellow', () => {
    const result = weeklyNutrients({ ...man25, days: week({ ironMg: 6 }) });
    if (result.status !== 'ok') throw new Error('expected rows');
    expect(result.rows.find((r) => r.key === 'ironMg')).toMatchObject({
      intake: 6,
      reference: 8,
      percent: 75,
      tone: 'yellow',
    });
  });

  it('A food without iron data lowers the coverage instead of counting as 0', () => {
    const days: NutrientDay[] = week({ ironMg: 8 }).map((d) => ({
      ...d,
      entries: [...d.entries, { grams: 100, per100g: { ironMg: null } }],
    }));
    const result = weeklyNutrients({ ...man25, days });
    if (result.status !== 'ok') throw new Error('expected rows');
    const iron = result.rows.find((r) => r.key === 'ironMg');
    expect(iron).toMatchObject({ intake: 8, coverage: 0.5, tone: 'incomplete' });
  });

  it('With 3 logged days the card asks for 4', () => {
    expect(weeklyNutrients({ ...man25, days: week({ ironMg: 8 }, 3) })).toEqual({
      status: 'need-days',
      countedDays: 3,
      neededDays: 4,
    });
  });

  it('a day counts only with at least 2 meals logged', () => {
    const days = [...week({ ironMg: 8 }, 3), { ...dayWith({ ironMg: 8 }), meals: 1 }];
    expect(weeklyNutrients({ ...man25, days }).status).toBe('need-days');
  });

  it('2,500 mg of sodium shows red', () => {
    const result = weeklyNutrients({ ...man25, days: week({ sodiumMg: 2500 }) });
    if (result.status !== 'ok') throw new Error('expected rows');
    expect(result.rows.find((r) => r.key === 'sodiumMg')?.tone).toBe('red');
  });

  it('sodium: green up to 2,000 mg, yellow to 2,300', () => {
    const tone = (mg: number) => {
      const result = weeklyNutrients({ ...man25, days: week({ sodiumMg: mg }) });
      return result.status === 'ok' ? result.rows.find((r) => r.key === 'sodiumMg')?.tone : null;
    };
    expect(tone(2000)).toBe('green');
    expect(tone(2300)).toBe('yellow');
  });

  it("Changing the day's calorie target changes the fibre reference", () => {
    const at = (kcal: number) => {
      const result = weeklyNutrients({ ...man25, days: week({ fiberG: 20 }, 7, kcal) });
      return result.status === 'ok' ? result.rows.find((r) => r.key === 'fiberG')?.reference : null;
    };
    expect(at(2000)).toBeCloseTo(28, 10);
    expect(at(2500)).toBeCloseTo(35, 10);
  });

  it('reds first, then yellows, then greens, incomplete last', () => {
    const result = weeklyNutrients({
      ...man25,
      days: week({ ironMg: 4, zincMg: 9, calciumMg: 1200, vitaminCMg: null }),
    });
    if (result.status !== 'ok') throw new Error('expected rows');
    const tones = result.rows.map((r) => r.tone);
    const order = ['red', 'yellow', 'green', 'incomplete'];
    expect([...tones].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(tones);
  });
});
