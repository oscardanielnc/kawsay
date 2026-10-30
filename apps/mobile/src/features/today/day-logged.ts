export type Area = 'meals' | 'activity' | 'water' | 'body' | 'sleep' | 'weight';
export const AREAS: readonly Area[] = ['meals', 'activity', 'water', 'body', 'sleep', 'weight'];

/** What the day has, counted by the route from each feature. */
export interface DayCounts {
  mealSlotsWithEntries: number;
  activityCount: number;
  noActivity: boolean;
  weighedToday: boolean;
  urineNoted: boolean;
  /** A visit, gases or "didn't go today". */
  bathroomNoted: boolean;
  /** Stress, energy and mood answered (0–3). Bloating left the day on 2026-10-30 (F10). */
  bodyAnswers: number;
  sleepSessions: number;
  sleepRated: number;
}

/** The six parts of the "day logged" ring (design S2), with the Today v3 prototype's rules. */
export function dayLogged(day: DayCounts): { areas: Record<Area, boolean>; done: number } {
  const areas: Record<Area, boolean> = {
    meals: day.mealSlotsWithEntries >= 2,
    activity: day.noActivity || day.activityCount > 0,
    // Hydration is optional (F10): its step is the urine colour alone.
    water: day.urineNoted,
    body: day.bathroomNoted && day.bodyAnswers >= 3,
    sleep: day.sleepSessions > 0 && day.sleepRated === day.sleepSessions,
    weight: day.weighedToday,
  };
  return { areas, done: AREAS.filter((a) => areas[a]).length };
}
