import type { Profile } from './profile-db';
import { profileTargets, trendWeightKg } from './profile-targets';

const profile: Profile = {
  id: 'p',
  updatedAt: 0,
  deletedAt: null,
  sex: 'female',
  heightCm: 160,
  ageYears: 35,
  ageSetOn: '2026-10-08',
  goalWeightKg: null,
  goalDate: null,
  climate: 'warm',
  proteinGPerKg: 1.6,
  fatShare: 0.25,
  movementGoalMin: 30,
  usualSleepStart: '23:00',
  usualSleepEnd: '07:00',
  usualNapStart: null,
  usualNapEnd: null,
  waistEnabled: false,
  waistReminderDay: null,
  symptomsEnabled: false,
  intimateEnabled: false,
  expenditureFactor: 1,
  refinedFlourShare: null,
  liverEnabled: null,
};

describe('profileTargets', () => {
  it('30 min of stairs raises the day target immediately (F08)', () => {
    const rest = profileTargets(profile, '2026-10-08', 70);
    const stairs = profileTargets(profile, '2026-10-08', 70, [{ met: 6.8, hours: 0.5 }]);
    expect(stairs.targetKcal).toBeGreaterThan(rest.targetKcal);
    expect(stairs.activityKcal).toBeGreaterThan(rest.activityKcal);
  });

  it('a shorter logged night raises the day target: more hours awake at the baseline (F11)', () => {
    const usual = profileTargets(profile, '2026-10-08', 70);
    const short = profileTargets(profile, '2026-10-08', 70, [], 6);
    expect(short.targetKcal).toBeGreaterThan(usual.targetKcal);
  });

  it('the trend weight is null before the first weigh-in', () => {
    expect(trendWeightKg([])).toBeNull();
  });
});
