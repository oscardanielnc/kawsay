import { describe, expect, it } from 'vitest';
import { addedSugarLimits, addedSugarState } from './added-sugar';

describe('added sugar (F22)', () => {
  it('With a 2,000 kcal target the green limit is 25 g and the yellow limit 50 g', () => {
    expect(addedSugarLimits(2000)).toEqual({ greenMaxG: 25, yellowMaxG: 50 });
  });

  it('follows the day target: 2,400 kcal allows 30 g in green', () => {
    expect(addedSugarLimits(2400).greenMaxG).toBe(30);
  });

  it('green up to the limit included, yellow up to 10%, red above', () => {
    const limits = addedSugarLimits(2000);
    expect(addedSugarState(25, limits)).toBe('green');
    expect(addedSugarState(25.1, limits)).toBe('yellow');
    expect(addedSugarState(50, limits)).toBe('yellow');
    expect(addedSugarState(51, limits)).toBe('red');
  });

  it('rejects a target that is not positive', () => {
    expect(() => addedSugarLimits(0)).toThrow(RangeError);
  });
});
