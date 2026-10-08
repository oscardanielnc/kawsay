import { describe, expect, it } from 'vitest';
import { dayColour, type DayLog } from './day-colour';

const good: DayLog = {
  hasEntries: true,
  intakeKcal: 1850,
  targetKcal: 1840,
  proteinG: 115,
  targetProteinG: 116,
  activityLogged: true,
};

describe('dayColour (F14)', () => {
  it('green: calories and protein in green and the activity logged', () => {
    expect(dayColour(good)).toBe('green');
  });

  it('yellow: one condition fails', () => {
    expect(dayColour({ ...good, activityLogged: false })).toBe('yellow');
    expect(dayColour({ ...good, intakeKcal: 2100 })).toBe('yellow');
  });

  it('red: two or more fail', () => {
    expect(dayColour({ ...good, proteinG: 60, activityLogged: false })).toBe('red');
    expect(dayColour({ ...good, intakeKcal: 1200, proteinG: 60, activityLogged: false })).toBe(
      'red',
    );
  });

  it('calories in the yellow zone fail the green condition', () => {
    expect(dayColour({ ...good, intakeKcal: 1840 * 0.85 })).toBe('yellow');
  });

  it('a day without entries is grey, not red', () => {
    expect(dayColour({ ...good, hasEntries: false, intakeKcal: 0, proteinG: 0 })).toBe('grey');
  });

  it('editing a past entry recolours that day: the colour is recomputed from the entries', () => {
    const before = dayColour({ ...good, activityLogged: false });
    const after = dayColour({ ...good, activityLogged: true });
    expect([before, after]).toEqual(['yellow', 'green']);
  });
});
