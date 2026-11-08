import { describe, expect, it } from 'vitest';
import { benjaminiHochberg } from './false-discovery';

describe('benjaminiHochberg (F17)', () => {
  it('one test keeps its p', () => {
    expect(benjaminiHochberg([0.04])).toEqual([0.04]);
  });

  it('p = 0.01, 0.04, 0.03, 0.5 adjust to 0.04, 0.0533, 0.0533, 0.5 in the same order', () => {
    const q = benjaminiHochberg([0.01, 0.04, 0.03, 0.5]);
    expect(q[0]).toBeCloseTo(0.04, 6);
    expect(q[1]).toBeCloseTo(0.0533, 4);
    expect(q[2]).toBeCloseTo(0.0533, 4);
    expect(q[3]).toBeCloseTo(0.5, 6);
  });

  it('a p of 0.01 among 200 tests is no longer a finding (q > 0.1)', () => {
    const p = [0.01, ...Array.from({ length: 199 }, () => 0.6)];
    expect(benjaminiHochberg(p)[0]).toBeGreaterThan(0.1);
  });
});
