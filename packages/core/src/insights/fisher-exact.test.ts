import { describe, expect, it } from 'vitest';
import { fisherExactP } from './fisher-exact';

describe('fisherExactP (F17)', () => {
  it("the tea-tasting table 3·1 / 1·3 gives p = 0.486, Fisher's own example", () => {
    expect(fisherExactP(3, 1, 1, 3)).toBeCloseTo(0.4857, 4);
  });

  it('an even split is no evidence at all: p = 1', () => {
    expect(fisherExactP(2, 2, 2, 2)).toBeCloseTo(1, 6);
  });

  it('5 bad days all after the exposure (15 days) and none in the other 10 gives p ≈ 0.061', () => {
    expect(fisherExactP(5, 10, 0, 10)).toBeCloseTo(0.0612, 3);
  });

  it('is symmetric: swapping exposed and baseline rows keeps p', () => {
    expect(fisherExactP(1, 9, 6, 4)).toBeCloseTo(fisherExactP(6, 4, 1, 9), 10);
  });
});
