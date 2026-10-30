import { describe, expect, it } from 'vitest';
import { portionImpact, type GaugeAmounts } from './portion-impact';

const targets = { targetKcal: 2000, proteinG: 100, fatG: 60, carbsG: 250 };
const amounts = (over: Partial<GaugeAmounts>): GaugeAmounts => ({
  kcal: 0,
  proteinG: 0,
  fatG: 0,
  carbsG: 0,
  addedSugarG: 0,
  refinedFlourG: 0,
  ...over,
});
const eaten = amounts({
  kcal: 1240,
  proteinG: 60,
  fatG: 40,
  carbsG: 150,
  addedSugarG: 14,
  refinedFlourG: 90,
});

describe('portion impact preview (F05, ADR 0020)', () => {
  it('each gauge gets now, after and the delta of the portion', () => {
    const { gauges } = portionImpact({
      targets,
      eaten,
      portion: amounts({ kcal: 410, proteinG: 22 }),
    });
    expect(gauges.calories).toMatchObject({ now: 1240, after: 1650, delta: 410 });
    expect(gauges.protein).toMatchObject({ now: 60, after: 82, delta: 22 });
    expect(gauges.fat).toMatchObject({ now: 40, after: 40, delta: 0 });
  });

  it('Changing the portion from ½ to 1 moves every preview needle and delta before adding', () => {
    const lomo = amounts({
      kcal: 820,
      proteinG: 40,
      fatG: 30,
      carbsG: 80,
      addedSugarG: 2,
      refinedFlourG: 60,
    });
    const half = (x: GaugeAmounts) =>
      Object.fromEntries(Object.entries(x).map(([k, v]) => [k, v / 2])) as unknown as GaugeAmounts;
    const a = portionImpact({ targets, eaten, portion: half(lomo) }).gauges;
    const b = portionImpact({ targets, eaten, portion: lomo }).gauges;
    for (const key of Object.keys(a) as (keyof typeof a)[]) {
      expect(b[key].after).toBeGreaterThan(a[key].after);
      expect(b[key].delta).toBe(a[key].delta * 2);
    }
  });

  it('reaching a range is not an alert; going over it is', () => {
    const fills = portionImpact({ targets, eaten, portion: amounts({ kcal: 600 }) });
    expect(fills.gauges.calories.zoneAfter).toBe('green');
    expect(fills.alerts).toEqual([]);
    const over = portionImpact({ targets, eaten, portion: amounts({ kcal: 1100, fatG: 40 }) });
    expect(over.alerts).toEqual(['calories', 'fat']);
  });

  it('A personal Coca-Cola shows "Mucho azúcar para una comida" before adding it', () => {
    const coke = amounts({ kcal: 210, carbsG: 55, addedSugarG: 55 });
    const impact = portionImpact({ targets, eaten, portion: coke });
    expect(impact.sugarHeavy).toBe(true);
    expect(impact.alerts).toContain('addedSugar');
    expect(
      portionImpact({ targets, eaten, portion: amounts({ addedSugarG: 10 }) }).sugarHeavy,
    ).toBe(false);
  });

  it('refined flours use the personal limit', () => {
    const bread = amounts({ refinedFlourG: 40 });
    expect(portionImpact({ targets, eaten, portion: bread }).alerts).toEqual(['refinedFlour']);
    expect(
      portionImpact({ targets, eaten, portion: bread, refinedFlourShare: 0.6 }).alerts,
    ).toEqual([]);
  });
});
