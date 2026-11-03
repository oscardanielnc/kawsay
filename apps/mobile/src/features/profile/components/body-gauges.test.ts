import { BMI_BANDS, bmiPosition, WAIST_BANDS, waistPosition } from './body-gauges';

describe('BMI gauge (profile): a linear 15–35 scale, so progress shows', () => {
  it('each BMI point is 5% of the arc: going from 28 to the goal 24 moves the needle a fifth of it', () => {
    expect(bmiPosition(28) - bmiPosition(24)).toBeCloseTo(0.2, 10);
  });

  it('from 16 to a goal of 19 the needle moves 15% of the arc', () => {
    expect(bmiPosition(19) - bmiPosition(16)).toBeCloseTo(0.15, 10);
  });

  it('zones keep their real width: red < 17 · yellow 17–18.5 · green 18.5–25 · yellow 25–30 · red ≥ 30', () => {
    expect(BMI_BANDS.map((b) => [b.tone, b.to])).toEqual([
      ['red', 0.1],
      ['yellow', 0.175],
      ['green', 0.5],
      ['yellow', 0.75],
      ['red', 1],
    ]);
  });

  it('clamps to the ends outside 15–35', () => {
    expect(bmiPosition(12)).toBe(0);
    expect(bmiPosition(41)).toBe(1);
  });
});

describe('waist-to-height gauge (profile): linear 0.30–0.75 (ADR 0027)', () => {
  it('blue to 0.5 · amber to 0.6 · coral to 0.75 at their real width', () => {
    expect(WAIST_BANDS.map((b) => [b.tone, Math.round(b.to * 1000) / 1000])).toEqual([
      ['green', 0.444],
      ['yellow', 0.667],
      ['red', 1],
    ]);
  });

  it('0.55 sits at 56% of the arc; past the ends it stops', () => {
    expect(waistPosition(0.55)).toBeCloseTo(0.5556, 3);
    expect(waistPosition(0.2)).toBe(0);
    expect(waistPosition(0.9)).toBe(1);
  });
});
