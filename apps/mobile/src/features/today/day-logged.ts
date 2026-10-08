export type Area = 'meals' | 'activity' | 'water' | 'body' | 'sleep' | 'weight';
export const AREAS: readonly Area[] = ['meals', 'activity', 'water', 'body', 'sleep', 'weight'];

/**
 * The six parts of the "day logged" ring (design S2). Water and body-and-mood arrive with F10, sleep with F11:
 * until then those parts stay pending.
 */
export function dayLogged(day: {
  mealSlotsWithEntries: number;
  activityCount: number;
  noActivity: boolean;
  weighedToday: boolean;
}): { areas: Record<Area, boolean>; done: number } {
  const areas: Record<Area, boolean> = {
    meals: day.mealSlotsWithEntries >= 2,
    activity: day.noActivity || day.activityCount > 0,
    water: false,
    body: false,
    sleep: false,
    weight: day.weighedToday,
  };
  return { areas, done: AREAS.filter((a) => areas[a]).length };
}
