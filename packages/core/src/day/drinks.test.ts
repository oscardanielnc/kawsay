import { describe, expect, it } from 'vitest';
import { drinksGoalGlasses, drunkGlasses } from './drinks';

describe('drinksGoalGlasses: 80% of EFSA total water, in 250 ml glasses (F10)', () => {
  it('male, temperate → 8 glasses (2.0 L)', () => {
    expect(drinksGoalGlasses({ sex: 'male', climate: 'temperate', sweatedALot: false })).toBe(8);
  });

  it('female, temperate → 7 glasses: 6.4 rounds up, never below 80%', () => {
    expect(drinksGoalGlasses({ sex: 'female', climate: 'temperate', sweatedALot: false })).toBe(7);
  });

  it('a warm climate adds 2 glasses (F01); a cold one adds none', () => {
    expect(drinksGoalGlasses({ sex: 'male', climate: 'warm', sweatedALot: false })).toBe(10);
    expect(drinksGoalGlasses({ sex: 'male', climate: 'cold', sweatedALot: false })).toBe(8);
  });

  it('"I sweated a lot today" adds 2 glasses', () => {
    expect(drinksGoalGlasses({ sex: 'male', climate: 'warm', sweatedALot: true })).toBe(12);
  });
});

describe('drunkGlasses', () => {
  it('adds every drink in glasses of 250 ml, caloric drinks from meals included', () => {
    expect(
      drunkGlasses([
        { ml: 500, alcohol: false },
        { ml: 250, alcohol: false },
        { ml: 300, alcohol: false },
      ]),
    ).toBeCloseTo(4.2, 10);
  });

  it('alcohol is logged but not counted', () => {
    expect(drunkGlasses([{ ml: 330, alcohol: true }])).toBe(0);
  });

  it('rejects a negative volume', () => {
    expect(() => drunkGlasses([{ ml: -1, alcohol: false }])).toThrow(RangeError);
  });
});
