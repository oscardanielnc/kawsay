import type { Tone } from '../shared/tone';

/**
 * Movement minutes (ADR 0020, WHO 2020): a block at MET ≥ 3.0 counts its minutes, at MET ≥ 6.0 it counts double
 * (75 vigorous = 150 moderate); lighter blocks and the base day do not count.
 */
export function movementMinutes(blocks: readonly { met: number; minutes: number }[]): number {
  return blocks.reduce(
    (sum, { met, minutes }) => sum + (met >= 6 ? 2 * minutes : met >= 3 ? minutes : 0),
    0,
  );
}

/** Week's movement: 150 or more blue (300 is "ideal"), 75–149 amber, under 75 coral. */
export function movementZone(weekMinutes: number): Tone {
  if (weekMinutes >= 150) return 'green';
  return weekMinutes >= 75 ? 'yellow' : 'red';
}
