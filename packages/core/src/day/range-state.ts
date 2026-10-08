import { assertPositive } from '../shared/assert';
import { roundTo } from '../shared/round';
import type { Tone } from '../shared/tone';

export type Metric = 'calories' | 'protein' | 'fat' | 'carbs';

/** Zone limits as % of the day target; green and yellow include their limits (design/direction.md). */
const ZONES: Record<
  Metric,
  { yellowFrom: number; greenFrom: number; greenTo: number; yellowTo: number }
> = {
  calories: { yellowFrom: 80, greenFrom: 90, greenTo: 110, yellowTo: 120 },
  protein: { yellowFrom: 70, greenFrom: 90, greenTo: 130, yellowTo: 160 },
  fat: { yellowFrom: 65, greenFrom: 80, greenTo: 120, yellowTo: 135 },
  carbs: { yellowFrom: 65, greenFrom: 80, greenTo: 120, yellowTo: 135 },
};

/** `left`: the day is still open and the value is below green, shown as "N left" in a neutral colour. */
export type RangeState = Tone | 'left';

export function rangeState({
  metric,
  value,
  target,
  dayOpen,
}: {
  metric: Metric;
  value: number;
  target: number;
  dayOpen: boolean;
}): RangeState {
  assertPositive({ target });
  const zone = ZONES[metric];
  const percent = roundTo((value / target) * 100, 6); // 110.00000000000001 is 110
  if (percent < zone.greenFrom && dayOpen) return 'left';
  if (percent < zone.yellowFrom || percent > zone.yellowTo) return 'red';
  if (percent < zone.greenFrom || percent > zone.greenTo) return 'yellow';
  return 'green';
}
