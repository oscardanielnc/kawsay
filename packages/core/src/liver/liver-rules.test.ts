import { describe, expect, it } from 'vitest';
import { movementMinutes, movementZone } from '../energy/movement-minutes';
import { strengthDaysZone } from '../energy/strength-days';
import { weekSleepAverage } from '../sleep/week-average';
import { liverGoalRange } from '../profile/liver-goal';
import { alcoholGrams, alcoholZone, ALCOHOL_DEFAULTS } from './alcohol-grams';
import { fib4 } from './fib4';
import { isSugaryDrink, sugaryDrinksZone } from './sugary-drinks';
import { weekSugar } from './week-sugar';

describe('liver-health rules (ADR 0020, F25)', () => {
  it('A 620 ml beer at 5% logs 24.5 g of alcohol', () => {
    expect(alcoholGrams(620, 5)).toBeCloseTo(24.459, 3);
    expect(Math.round(alcoholGrams(620, 5) * 10) / 10).toBe(24.5);
  });

  it('alcohol defaults: beer 330 ml at 5%, wine 150 ml at 12%, pisco 45 ml at 42%', () => {
    expect(ALCOHOL_DEFAULTS.beer).toEqual({ ml: 330, abv: 5 });
    expect(ALCOHOL_DEFAULTS.wine).toEqual({ ml: 150, abv: 12 });
    expect(ALCOHOL_DEFAULTS.pisco).toEqual({ ml: 45, abv: 42 });
  });

  it('alcohol in a week: 0 g blue, 1–209 g amber, 210 g coral (women 140)', () => {
    expect(alcoholZone(0, 'male')).toBe('green');
    expect(alcoholZone(100, 'male')).toBe('yellow');
    expect(alcoholZone(210, 'male')).toBe('red');
    expect(alcoholZone(140, 'female')).toBe('red');
  });

  it('A drink with 4 g of added sugar is not a sugary drink; one with 8 g is', () => {
    expect(isSugaryDrink(4)).toBe(false);
    expect(isSugaryDrink(8)).toBe(true);
    expect(isSugaryDrink(5)).toBe(true);
  });

  it('sugary drinks in a week: 0 blue, 1–2 amber, 3 or more coral', () => {
    expect([0, 1, 2, 3].map(sugaryDrinksZone)).toEqual(['green', 'yellow', 'yellow', 'red']);
  });

  it('movement: MET ≥ 3 counts, ≥ 6 counts double, the rest not; week 150 blue, 75 amber', () => {
    expect(
      movementMinutes([
        { met: 2.8, minutes: 40 },
        { met: 3.5, minutes: 30 },
        { met: 6.8, minutes: 15 },
      ]),
    ).toBe(60);
    expect(movementZone(150)).toBe('green');
    expect(movementZone(120)).toBe('yellow');
    expect(movementZone(60)).toBe('red');
  });

  it('strength days: 2 blue, 1 amber, 0 coral', () => {
    expect([2, 1, 0].map(strengthDaysZone)).toEqual(['green', 'yellow', 'red']);
  });

  it('A week without sleep logs shows "sin dato", not 0 h; a week averaging 6 h 40 is amber', () => {
    expect(weekSleepAverage([null, null, null, null, null, null, null])).toBeNull();
    const week = weekSleepAverage([6.5, 7, 6.5, null, 6.75, 6.5, 6.75]);
    expect(week?.hours).toBeCloseTo(6 + 40 / 60, 10);
    expect(week?.zone).toBe('yellow');
    expect(weekSleepAverage([8, 8])?.zone).toBe('green');
    expect(weekSleepAverage([5, 5])?.zone).toBe('red');
  });

  it('FIB-4 for 40 years, AST 30, ALT 36 and platelets 250 gives 0.80 (low)', () => {
    const score = fib4({ ageYears: 40, ast: 30, alt: 36, platelets: 250 });
    expect(score.value).toBeCloseTo(0.8, 2);
    expect(score.band).toBe('low');
    expect(fib4({ ageYears: 55, ast: 40, alt: 36, platelets: 200 }).band).toBe('see-doctor');
    expect(fib4({ ageYears: 60, ast: 60, alt: 36, platelets: 150 }).band).toBe('high');
    // Above 65 years low reaches 2.0: 1.75 is low there, while it would be "see a doctor" at 50.
    expect(fib4({ ageYears: 70, ast: 25, alt: 25, platelets: 200 }).band).toBe('low');
  });

  it('80 kg with BMI 27.7 suggests a goal between 74.4 and 72.0 kg; under BMI 25 no suggestion', () => {
    expect(liverGoalRange(80, 27.7)).toEqual({ fromKg: 74.4, toKg: 72 });
    expect(liverGoalRange(60, 22)).toBeNull();
  });

  it('Daily added sugar 18, 30, 12, 26, 41, 22 and 19 g with a 1,700 kcal target shows 24 g in amber', () => {
    const week = weekSugar([18, 30, 12, 26, 41, 22, 19], 1700);
    expect(week.averageG).toBe(24);
    expect(week.zone).toBe('yellow');
    expect(week.idealG).toBe(21.25);
    expect(week.days.filter((d) => d.zone !== 'green')).toHaveLength(4);
    expect(week.topDay).toBe(4);
  });
});
