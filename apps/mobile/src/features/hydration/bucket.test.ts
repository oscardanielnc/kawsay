import { bucketLayers } from './bucket';

const none = { water: 0, 'zero-calorie': 0, alcohol: 0, caloric: 0 };

describe('bucketLayers (hydration bucket)', () => {
  it('an empty day is an empty bucket of the daily goal', () => {
    expect(bucketLayers(none, 12)).toEqual({ capacity: 12, layers: [] });
  });

  it('below the goal each glass fills 1/goal; caloric at the bottom, then alcohol, coffee or tea, water on top', () => {
    const { layers } = bucketLayers({ water: 3, 'zero-calorie': 2, alcohol: 1, caloric: 2 }, 12);
    expect(layers).toEqual([
      { kind: 'caloric', from: 0, to: 2 / 12 },
      { kind: 'alcohol', from: 2 / 12, to: 3 / 12 },
      { kind: 'zero-calorie', from: 3 / 12, to: 5 / 12 },
      { kind: 'water', from: 5 / 12, to: 8 / 12 },
    ]);
  });

  it('goal 12 and 14 glasses drunk: the bucket is full and 7 glasses of water fill 50%', () => {
    const { capacity, layers } = bucketLayers(
      { water: 7, 'zero-calorie': 4, alcohol: 0, caloric: 3 },
      12,
    );
    expect(capacity).toBe(14);
    const water = layers.find((l) => l.kind === 'water')!;
    expect(water.to - water.from).toBeCloseTo(0.5, 10);
    expect(layers.at(-1)?.to).toBeCloseTo(1, 10);
  });

  it('a kind with no glasses has no layer; half glasses count as half', () => {
    expect(bucketLayers({ ...none, caloric: 1.5 }, 6).layers).toEqual([
      { kind: 'caloric', from: 0, to: 0.25 },
    ]);
  });
});
