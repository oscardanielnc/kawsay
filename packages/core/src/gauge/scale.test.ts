import { describe, expect, it } from 'vitest';
import { RANGE_ZONES } from '../day/range-state';
import { gaugePosition, linearScale, oneSidedScale, twoSidedScale, type GaugeScale } from './scale';

/** Zone widths as % of the arc, rounded to 0.1 for reading. */
const widths = (scale: GaugeScale) =>
  scale.zones.map((z) => Math.round((z.to - z.from) * 1000) / 10);
const tones = (scale: GaugeScale) => scale.zones.map((z) => z.tone);
/** Zone ends back in the gauge's own unit. */
const ends = (scale: GaugeScale) =>
  scale.zones.map((z) => Math.round(scale.min + z.to * (scale.max - scale.min)));

describe('twoSidedScale: linear 0 → upper coral start + 40% of target (ADR 0027)', () => {
  it('target 2,000 kcal → arc 0–3,200: coral to 1,600, amber to 1,800, blue to 2,200, amber to 2,400, coral to 3,200', () => {
    const scale = twoSidedScale(2000, RANGE_ZONES.calories);
    expect(scale.min).toBe(0);
    expect(scale.max).toBe(3200);
    expect(ends(scale)).toEqual([1600, 1800, 2200, 2400, 3200]);
    expect(tones(scale)).toEqual(['red', 'yellow', 'green', 'yellow', 'red']);
    expect(scale.zones.map((z) => z.to - z.from)).toEqual([0.5, 0.0625, 0.125, 0.0625, 0.25]);
  });

  it('protein runs to 200% of target: 35 · 10 · 20 · 15 · 20', () => {
    expect(widths(twoSidedScale(100, RANGE_ZONES.protein))).toEqual([35, 10, 20, 15, 20]);
  });

  it.each(['fat', 'carbs'] as const)(
    '%s runs to 175%%: 37.1 · 8.6 · 22.9 · 8.6 · 22.9',
    (metric) => {
      const scale = twoSidedScale(60, RANGE_ZONES[metric]);
      expect(scale.max).toBeCloseTo(105);
      expect(widths(scale)).toEqual([37.1, 8.6, 22.9, 8.6, 22.9]);
    },
  );

  it('zones touch end to end from 0 to 1', () => {
    const scale = twoSidedScale(1850, RANGE_ZONES.calories);
    expect(scale.zones[0]!.from).toBe(0);
    expect(scale.zones.at(-1)!.to).toBe(1);
    scale.zones.slice(1).forEach((z, i) => expect(z.from).toBe(scale.zones[i]!.to));
  });

  it('rejects a target that is not positive', () => {
    expect(() => twoSidedScale(0, RANGE_ZONES.calories)).toThrow(RangeError);
  });
});

describe('oneSidedScale: linear 0 → 1.5 × coral start', () => {
  it('added sugar 0–15% of kcal in thirds (2,000 kcal: blue to 25 g, amber to 50 g, coral to 75 g)', () => {
    const scale = oneSidedScale(25, 50);
    expect(scale.max).toBe(75);
    expect(ends(scale)).toEqual([25, 50, 75]);
    expect(tones(scale)).toEqual(['green', 'yellow', 'red']);
  });

  it('refined flours: blue 44.4 · amber 22.2 · coral 33.3 %', () => {
    expect(widths(oneSidedScale(100, 150))).toEqual([44.4, 22.2, 33.3]);
  });
});

describe('linearScale: fixed range with its limits', () => {
  it('waist-to-height linear 0.30–0.75: blue to 0.5, amber to 0.6, coral after', () => {
    const scale = linearScale(0.3, 0.75, [
      { upTo: 0.5, tone: 'green' },
      { upTo: 0.6, tone: 'yellow' },
      { upTo: 0.75, tone: 'red' },
    ]);
    expect(widths(scale)).toEqual([44.4, 22.2, 33.3]);
  });

  it('BMI unchanged: linear 15–35, each point 5% of the arc', () => {
    const scale = linearScale(15, 35, [
      { upTo: 17, tone: 'red' },
      { upTo: 18.5, tone: 'yellow' },
      { upTo: 25, tone: 'green' },
      { upTo: 30, tone: 'yellow' },
      { upTo: 35, tone: 'red' },
    ]);
    expect(widths(scale)).toEqual([10, 7.5, 32.5, 25, 25]);
    expect(gaugePosition(scale, 27).position).toBeCloseTo(0.6);
  });
});

describe('gaugePosition: where the needle points', () => {
  const scale = twoSidedScale(2000, RANGE_ZONES.calories);

  it('is linear: 1,600 kcal sits at the half of the arc', () => {
    expect(gaugePosition(scale, 1600)).toEqual({ position: 0.5, overflow: false });
  });

  it('stops at the right end past the maximum and flags the overflow ("+")', () => {
    expect(gaugePosition(scale, 3500)).toEqual({ position: 1, overflow: true });
  });

  it('the maximum itself is not an overflow', () => {
    expect(gaugePosition(scale, 3200)).toEqual({ position: 1, overflow: false });
  });

  it('stops at the left end below the minimum', () => {
    expect(gaugePosition(linearScale(15, 35, [{ upTo: 35, tone: 'green' }]), 12).position).toBe(0);
  });
});
