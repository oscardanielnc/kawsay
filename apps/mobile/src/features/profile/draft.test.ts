import { draftTargets, initialDraft, toProfileInput, type Draft } from './draft';

const today = '2026-10-08';
const oscarLike: Draft = {
  ...initialDraft,
  sex: 'male',
  ageYears: 30,
  heightCm: 170,
  weightKg: 80,
};

describe('onboarding draft (F01)', () => {
  it('80 kg, 170 cm, 30 years, male, maintaining: a day without exercise is ≈ 2,393 kcal (ADR 0009)', () => {
    const targets = draftTargets(oscarLike);
    expect(targets.targetKcal).toBeCloseTo(2393, 0);
    expect(Math.round(targets.proteinG)).toBe(116);
  });

  it('losing 0.5 kg/week gives the F09 example: ≈ 1,840 kcal', () => {
    const targets = draftTargets({ ...oscarLike, goal: 'lose', goalWeightKg: 74, weeks: 12 });
    expect(targets.targetKcal).toBeCloseTo(1840, -1);
  });

  it('turns the draft into the stored profile: goal date from the weeks, age dated today', () => {
    const input = toProfileInput(
      { ...oscarLike, goal: 'lose', goalWeightKg: 70, weeks: 12 },
      today,
    );
    expect(input).toMatchObject({
      sex: 'male',
      ageYears: 30,
      ageSetOn: today,
      goalWeightKg: 70,
      goalDate: '2026-12-31',
      proteinGPerKg: 1.6,
      fatShare: 0.25,
    });
  });

  it('maintaining stores no goal', () => {
    expect(toProfileInput(oscarLike, today)).toMatchObject({ goalWeightKg: null, goalDate: null });
  });

  it('a nap is stored only when the user takes one', () => {
    expect(toProfileInput(oscarLike, today)).toMatchObject({
      usualNapStart: null,
      usualNapEnd: null,
    });
    expect(toProfileInput({ ...oscarLike, nap: true }, today)).toMatchObject({
      usualNapStart: '13:30',
      usualNapEnd: '14:00',
    });
  });

  it('cannot be stored before the sex is chosen', () => {
    expect(() => toProfileInput({ ...oscarLike, sex: null }, today)).toThrow();
  });
});
