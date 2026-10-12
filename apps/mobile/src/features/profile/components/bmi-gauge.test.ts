import { BMI_BANDS, bmiPosition } from './bmi-gauge';

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
