import { describe, expect, it } from 'vitest';
import { weeklySummary, type WeekDay } from './weekly-summary';

const day = (colour: WeekDay['colour'], extra: Partial<WeekDay> = {}): WeekDay => ({
  colour,
  movementMinutes: 0,
  trendKg: null,
  weighed: false,
  ...extra,
});

describe('weekly summary (F20)', () => {
  it('A week with 4 green, 2 yellow and 1 red day shows "4 · 2 · 1"', () => {
    const week = ['green', 'green', 'green', 'green', 'yellow', 'yellow', 'red'] as const;
    expect(weeklySummary(week.map((c) => day(c))).days).toEqual({
      green: 4,
      yellow: 2,
      red: 1,
      grey: 0,
    });
  });

  it('grey days are not counted as good or bad', () => {
    expect(weeklySummary([day('grey'), day('green')]).days).toEqual({
      green: 1,
      yellow: 0,
      red: 0,
      grey: 1,
    });
  });

  it('adds the movement minutes of the week against the WHO 150', () => {
    const summary = weeklySummary([
      day('green', { movementMinutes: 40 }),
      day('green', { movementMinutes: 35 }),
    ]);
    expect(summary.movement).toEqual({ minutes: 75, goalMinutes: 150 });
  });

  it('With 2 weights in the week, the weight tile reads "Pésate más días"', () => {
    const summary = weeklySummary([
      day('green', { weighed: true, trendKg: 80 }),
      day('green', { weighed: true, trendKg: 79.9 }),
      day('green'),
    ]);
    expect(summary.weight).toEqual({ kind: 'need-more', weights: 2 });
  });

  it('with 3 weights, the change of the trend from the first to the last weighed day', () => {
    const summary = weeklySummary([
      day('green', { weighed: true, trendKg: 80 }),
      day('green', { weighed: true, trendKg: 79.8 }),
      day('green'),
      day('green', { weighed: true, trendKg: 79.6 }),
    ]);
    expect(summary.weight.kind).toBe('change');
    expect(summary.weight.kind === 'change' && summary.weight.changeKg).toBeCloseTo(-0.4, 10);
  });
});
