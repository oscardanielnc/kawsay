import { addDays, daysBetween, type LocalDate } from '@kawsay/core/shared/local-date';
import { ageOn, sleepHours } from '@kawsay/core/profile/profile';
import { computeDayTargets, type DayTargets } from '@kawsay/core/targets/compute-day-targets';
import { goalPace } from '@kawsay/core/targets/day-target';
import { FAT_SHARE, PROTEIN_G_PER_KG } from '@kawsay/core/targets/macros';
import type { Profile, ProfileInput } from './profile-db';

/** What the onboarding steps fill in (F01); stored as a profile when it ends. */
export interface Draft {
  sex: 'male' | 'female' | null;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  goal: 'lose' | 'maintain';
  goalWeightKg: number | null;
  weeks: number;
  climate: 'warm' | 'temperate' | 'cold';
  sleepStart: string;
  sleepEnd: string;
  nap: boolean;
  napStart: string;
  napEnd: string;
  waistEnabled: boolean;
  waistReminderDay: number;
  symptomsEnabled: boolean;
  intimateEnabled: boolean;
  movementGoalMin: number;
  proteinGPerKg: number;
  fatShare: number;
}

export const initialDraft: Draft = {
  sex: null,
  ageYears: 30,
  heightCm: 165,
  weightKg: 70,
  goal: 'maintain',
  goalWeightKg: null,
  weeks: 12,
  climate: 'temperate',
  sleepStart: '23:00',
  sleepEnd: '07:00',
  nap: false,
  napStart: '13:30',
  napEnd: '14:00',
  waistEnabled: false,
  waistReminderDay: 6,
  symptomsEnabled: false,
  intimateEnabled: false,
  movementGoalMin: 30,
  proteinGPerKg: PROTEIN_G_PER_KG.default,
  fatShare: FAT_SHARE.default,
};

/** The goal weight shown when "lose" is chosen: 5 kg below today unless already set. */
export function goalWeightOf(draft: Draft): number {
  return draft.goalWeightKg ?? draft.weightKg - 5;
}

/** Pace and the safe-pace check for the goal step (F01: above 1% of body weight a week warns). */
export function draftPace(draft: Draft) {
  return goalPace({ currentKg: draft.weightKg, goalKg: goalWeightOf(draft), weeks: draft.weeks });
}

/** The target of a day without exercise, with the usual sleep (ADR 0009). */
export function draftTargets(draft: Draft): DayTargets {
  const losing = draft.goal === 'lose';
  return computeDayTargets({
    body: {
      sex: draft.sex ?? 'male',
      ageYears: draft.ageYears,
      heightCm: draft.heightCm,
      weightKg: draft.weightKg,
    },
    goalKgPerWeek: losing ? (goalWeightOf(draft) - draft.weightKg) / draft.weeks : 0,
    sleepHours: sleepHours(
      { start: draft.sleepStart, end: draft.sleepEnd },
      draft.nap ? { start: draft.napStart, end: draft.napEnd } : null,
    ),
    activities: [],
    routines: [],
    proteinGPerKg: draft.proteinGPerKg,
    fatShare: draft.fatShare,
  });
}

export function toProfileInput(draft: Draft, today: LocalDate): ProfileInput {
  if (!draft.sex) throw new Error('the sex is required by the BMR formula');
  const losing = draft.goal === 'lose';
  return {
    sex: draft.sex,
    heightCm: draft.heightCm,
    ageYears: draft.ageYears,
    ageSetOn: today,
    goalWeightKg: losing ? goalWeightOf(draft) : null,
    goalDate: losing ? addDays(today, draft.weeks * 7) : null,
    climate: draft.climate,
    proteinGPerKg: draft.proteinGPerKg,
    fatShare: draft.fatShare,
    movementGoalMin: draft.movementGoalMin,
    usualSleepStart: draft.sleepStart,
    usualSleepEnd: draft.sleepEnd,
    usualNapStart: draft.nap ? draft.napStart : null,
    usualNapEnd: draft.nap ? draft.napEnd : null,
    waistEnabled: draft.waistEnabled,
    waistReminderDay: draft.waistEnabled ? draft.waistReminderDay : null,
    symptomsEnabled: draft.symptomsEnabled,
    intimateEnabled: draft.intimateEnabled,
  };
}

/** The stored profile as an editable draft (Profile settings reuse the onboarding steps). */
export function profileToDraft(profile: Profile, today: LocalDate, weightKg: number): Draft {
  const weeksLeft = profile.goalDate
    ? Math.max(1, Math.round(daysBetween(today, profile.goalDate) / 7))
    : 12;
  return {
    sex: profile.sex,
    ageYears: ageOn({ ageYears: profile.ageYears, ageSetOn: profile.ageSetOn, today }),
    heightCm: profile.heightCm,
    weightKg,
    goal: profile.goalWeightKg === null ? 'maintain' : 'lose',
    goalWeightKg: profile.goalWeightKg,
    weeks: weeksLeft,
    climate: profile.climate,
    sleepStart: profile.usualSleepStart,
    sleepEnd: profile.usualSleepEnd,
    nap: profile.usualNapStart !== null,
    napStart: profile.usualNapStart ?? initialDraft.napStart,
    napEnd: profile.usualNapEnd ?? initialDraft.napEnd,
    waistEnabled: profile.waistEnabled,
    waistReminderDay: profile.waistReminderDay ?? initialDraft.waistReminderDay,
    symptomsEnabled: profile.symptomsEnabled,
    intimateEnabled: profile.intimateEnabled,
    movementGoalMin: profile.movementGoalMin,
    proteinGPerKg: profile.proteinGPerKg,
    fatShare: profile.fatShare,
  };
}
