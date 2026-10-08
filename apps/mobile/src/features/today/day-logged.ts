export type Area = 'meals' | 'activity' | 'water' | 'body' | 'sleep' | 'weight';
export const AREAS: readonly Area[] = ['meals', 'activity', 'water', 'body', 'sleep', 'weight'];

/** What the day has, counted by the route from each feature. */
export interface DayCounts {
  mealSlotsWithEntries: number;
  activityCount: number;
  noActivity: boolean;
  weighedToday: boolean;
  /** Glasses tapped in hydration plus drinks logged in meals. */
  drinkCount: number;
  urineNoted: boolean;
  /** A visit, gases or "didn't go today". */
  bathroomNoted: boolean;
  /** Bloating, stress, energy and mood answered (0–4). */
  bodyAnswers: number;
  sleepSessions: number;
  sleepRated: number;
}

/** The six parts of the "day logged" ring (design S2), with the Today v3 prototype's rules. */
export function dayLogged(day: DayCounts): { areas: Record<Area, boolean>; done: number } {
  const areas: Record<Area, boolean> = {
    meals: day.mealSlotsWithEntries >= 2,
    activity: day.noActivity || day.activityCount > 0,
    water: day.drinkCount > 0 && day.urineNoted,
    body: day.bathroomNoted && day.bodyAnswers >= 4,
    sleep: day.sleepSessions > 0 && day.sleepRated === day.sleepSessions,
    weight: day.weighedToday,
  };
  return { areas, done: AREAS.filter((a) => areas[a]).length };
}
