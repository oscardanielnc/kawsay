import { waistSegments } from './chart';

describe('waistSegments (F04)', () => {
  it('weeks without a measurement leave a gap, not a zero', () => {
    const { weeks, segments } = waistSegments(
      [
        { weekStart: '2026-09-14', cm: 94 },
        { weekStart: '2026-09-21', cm: 93.5 },
        { weekStart: '2026-10-05', cm: 92 },
      ],
      '2026-10-05',
      4,
    );
    expect(weeks).toEqual(['2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05']);
    expect(segments).toEqual([
      [
        { weekStart: '2026-09-14', cm: 94 },
        { weekStart: '2026-09-21', cm: 93.5 },
      ],
      [{ weekStart: '2026-10-05', cm: 92 }],
    ]);
    expect(segments.flat().some((w) => w.cm === 0)).toBe(false);
  });
});
