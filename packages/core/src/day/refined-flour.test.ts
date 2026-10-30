import { describe, expect, it } from 'vitest';
import { DEFAULT_REFINED_FLOUR_SHARE, refinedFlourLimits, refinedFlourState } from './refined-flour';

describe('refined flours (F24)', () => {
  it('the default personal limit is 50% of the carbohydrate target; amber reaches 150% of it', () => {
    expect(DEFAULT_REFINED_FLOUR_SHARE).toBe(0.5);
    expect(refinedFlourLimits(212)).toEqual({ limitG: 106, maxG: 159 });
  });

  it('Changing the personal ceiling moves the gauge zones the same day', () => {
    const before = refinedFlourLimits(212);
    const after = refinedFlourLimits(212, 0.4);
    expect(after.limitG).toBeCloseTo(84.8, 10);
    expect(refinedFlourState(100, before)).toBe('green');
    expect(refinedFlourState(100, after)).toBe('yellow');
  });

  it('blue up to the limit, amber up to 150% of it, coral above; limits belong to the lower zone', () => {
    const limits = refinedFlourLimits(200);
    expect(refinedFlourState(100, limits)).toBe('green');
    expect(refinedFlourState(118, limits)).toBe('yellow');
    expect(refinedFlourState(150, limits)).toBe('yellow');
    expect(refinedFlourState(151, limits)).toBe('red');
  });

  it('a share outside 10–100% is refused', () => {
    expect(() => refinedFlourLimits(200, 0)).toThrow();
    expect(() => refinedFlourLimits(200, 1.2)).toThrow();
  });
});
