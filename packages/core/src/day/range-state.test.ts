import { describe, expect, it } from 'vitest';
import { rangeState } from './range-state';

const target = 100; // values below read as % of the target

describe('rangeState: zones as % of the day target (design/direction.md)', () => {
  it.each([
    ['calories', 79, 'red'],
    ['calories', 80, 'yellow'],
    ['calories', 90, 'green'],
    ['calories', 110, 'green'],
    ['calories', 111, 'yellow'],
    ['calories', 120, 'yellow'],
    ['calories', 121, 'red'],
    ['protein', 69, 'red'],
    ['protein', 70, 'yellow'],
    ['protein', 90, 'green'],
    ['protein', 130, 'green'],
    ['protein', 160, 'yellow'],
    ['protein', 161, 'red'],
    ['fat', 64, 'red'],
    ['fat', 65, 'yellow'],
    ['fat', 80, 'green'],
    ['carbs', 120, 'green'],
    ['carbs', 135, 'yellow'],
    ['carbs', 136, 'red'],
  ] as const)('%s at %d%% of target on a closed day → %s', (metric, value, state) => {
    expect(rangeState({ metric, value, target, dayOpen: false })).toBe(state);
  });

  it('while the day is open, below green reads "left", not a warning', () => {
    expect(rangeState({ metric: 'calories', value: 50, target, dayOpen: true })).toBe('left');
    expect(rangeState({ metric: 'protein', value: 85, target, dayOpen: true })).toBe('left');
  });

  it('while the day is open, overshooting still shows its colour', () => {
    expect(rangeState({ metric: 'calories', value: 115, target, dayOpen: true })).toBe('yellow');
    expect(rangeState({ metric: 'calories', value: 130, target, dayOpen: true })).toBe('red');
    expect(rangeState({ metric: 'calories', value: 100, target, dayOpen: true })).toBe('green');
  });

  it('rejects a missing target', () => {
    expect(() => rangeState({ metric: 'fat', value: 50, target: 0, dayOpen: false })).toThrow(
      RangeError,
    );
  });
});
