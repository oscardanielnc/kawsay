import { describe, expect, it } from 'vitest';
import { weightTrend } from './weight-trend';

describe('weightTrend: exponential moving average, α = 0.1 per day (F03)', () => {
  it('starts at the first weight', () => {
    expect(weightTrend([{ date: '2026-10-01', kg: 80 }])).toEqual([
      { date: '2026-10-01', kg: 80, trendKg: 80 },
    ]);
  });

  it('an outlier day (+1.5 kg) moves the trend only slightly (F03)', () => {
    const trend = weightTrend([
      { date: '2026-10-01', kg: 80 },
      { date: '2026-10-02', kg: 80 },
      { date: '2026-10-03', kg: 81.5 },
      { date: '2026-10-04', kg: 80 },
    ]);
    expect(trend[2]!.trendKg).toBeCloseTo(80.15, 10);
    expect(trend[3]!.trendKg).toBeCloseTo(80.135, 10);
  });

  it('a gap of n days weighs the new value as n days at that weight: 1 − 0.9ⁿ', () => {
    const trend = weightTrend([
      { date: '2026-10-01', kg: 80 },
      { date: '2026-10-04', kg: 79 },
    ]);
    expect(trend[1]!.trendKg).toBeCloseTo(80 - (1 - 0.9 ** 3), 10);
  });

  it('sorts entries by date before smoothing', () => {
    const trend = weightTrend([
      { date: '2026-10-02', kg: 81 },
      { date: '2026-10-01', kg: 80 },
    ]);
    expect(trend.map((t) => t.date)).toEqual(['2026-10-01', '2026-10-02']);
    expect(trend[1]!.trendKg).toBeCloseTo(80.1, 10);
  });

  it('crosses month and daylight-saving boundaries by calendar day', () => {
    const trend = weightTrend([
      { date: '2026-10-31', kg: 80 },
      { date: '2026-11-01', kg: 81 },
    ]);
    expect(trend[1]!.trendKg).toBeCloseTo(80.1, 10);
  });

  it('no weights → no trend', () => {
    expect(weightTrend([])).toEqual([]);
  });

  it('rejects two weights on the same day (F03: one per day)', () => {
    expect(() =>
      weightTrend([
        { date: '2026-10-01', kg: 80 },
        { date: '2026-10-01', kg: 79 },
      ]),
    ).toThrow(RangeError);
  });

  it('rejects a malformed date', () => {
    expect(() => weightTrend([{ date: '2026-13-01', kg: 80 }])).toThrow(RangeError);
  });
});
