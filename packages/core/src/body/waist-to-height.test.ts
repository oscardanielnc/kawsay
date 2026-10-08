import { describe, expect, it } from 'vitest';
import { waistToHeight } from './waist-to-height';

describe('waistToHeight (F04, NICE 2022)', () => {
  it('92 cm at 170 cm → 0.54 in yellow, "increased risk"', () => {
    expect(waistToHeight({ waistCm: 92, heightCm: 170 })).toEqual({
      ratio: 0.54,
      band: 'increased',
      tone: 'yellow',
    });
  });

  it.each([
    [84, 0.49, 'healthy', 'green'],
    [85, 0.5, 'increased', 'yellow'],
    [100, 0.59, 'increased', 'yellow'],
    [102, 0.6, 'high', 'red'],
  ] as const)('%d cm at 170 cm → %d, %s (%s)', (waistCm, ratio, band, tone) => {
    expect(waistToHeight({ waistCm, heightCm: 170 })).toEqual({ ratio, band, tone });
  });

  it('classifies on the rounded value the user sees: 0.4996 shows 0.50, so it is yellow', () => {
    expect(waistToHeight({ waistCm: 0.4996 * 170, heightCm: 170 }).band).toBe('increased');
  });

  it('rejects a missing measurement', () => {
    expect(() => waistToHeight({ waistCm: 0, heightCm: 170 })).toThrow(RangeError);
  });
});
