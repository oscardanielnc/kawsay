import { describe, expect, it } from 'vitest';
import { ageOn, goalKgPerWeek, sleepHours } from './profile';

describe('ageOn: the age entered once keeps counting (F01)', () => {
  it('stays the same before a full year has passed', () => {
    expect(ageOn({ ageYears: 30, ageSetOn: '2026-10-07', today: '2027-10-06' })).toBe(30);
  });

  it('adds a year on each anniversary of the day it was entered', () => {
    expect(ageOn({ ageYears: 30, ageSetOn: '2026-10-07', today: '2027-10-07' })).toBe(31);
    expect(ageOn({ ageYears: 30, ageSetOn: '2026-10-07', today: '2030-01-01' })).toBe(33);
  });
});

describe('sleepHours: usual schedule, crossing midnight (F11)', () => {
  it('23:00 → 07:00 is 8 hours', () => {
    expect(sleepHours({ start: '23:00', end: '07:00' })).toBe(8);
  });

  it('adds the nap', () => {
    expect(sleepHours({ start: '23:00', end: '07:00' }, { start: '13:30', end: '14:00' })).toBe(
      8.5,
    );
  });

  it('a schedule inside the same day works too', () => {
    expect(sleepHours({ start: '01:15', end: '08:45' })).toBe(7.5);
  });

  it('a nap that ends before it starts adds 0 hours', () => {
    expect(sleepHours({ start: '23:00', end: '07:00' }, { start: '14:00', end: '13:30' })).toBe(8);
  });

  it('rejects a time that is not HH:MM', () => {
    expect(() => sleepHours({ start: '25:00', end: '07:00' })).toThrow(RangeError);
  });
});

describe('goalKgPerWeek: the pace left from today to the goal date', () => {
  it('80 → 70 kg with 12 weeks left is −0.833 kg/week', () => {
    expect(
      goalKgPerWeek({ currentKg: 80, goalKg: 70, today: '2026-10-07', goalDate: '2026-12-30' }),
    ).toBeCloseTo(-10 / 12, 10);
  });

  it('no goal weight means maintaining', () => {
    expect(
      goalKgPerWeek({ currentKg: 80, goalKg: null, today: '2026-10-07', goalDate: null }),
    ).toBe(0);
  });

  it('a goal reached or a date already past means maintaining', () => {
    expect(
      goalKgPerWeek({ currentKg: 70, goalKg: 72, today: '2026-10-07', goalDate: '2026-12-30' }),
    ).toBe(0);
    expect(
      goalKgPerWeek({ currentKg: 80, goalKg: 70, today: '2027-01-02', goalDate: '2026-12-30' }),
    ).toBe(0);
  });
});
