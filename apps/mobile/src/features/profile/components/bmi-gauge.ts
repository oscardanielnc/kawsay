import type { GaugeBand } from '@/components/data-display/gauge';

const MIN = 15;
const MAX = 35;

/** Where a BMI sits on the gauge: linear from 15 to 35, so each point is 5% of the arc and weekly progress shows. */
export function bmiPosition(bmi: number): number {
  return Math.min(1, Math.max(0, (bmi - MIN) / (MAX - MIN)));
}

/** WHO bands at their real width on that scale (design: the 15–35 track). */
export const BMI_BANDS: readonly GaugeBand[] = [
  { to: bmiPosition(17), tone: 'red' },
  { to: bmiPosition(18.5), tone: 'yellow' },
  { to: bmiPosition(25), tone: 'green' },
  { to: bmiPosition(30), tone: 'yellow' },
  { to: 1, tone: 'red' },
];
