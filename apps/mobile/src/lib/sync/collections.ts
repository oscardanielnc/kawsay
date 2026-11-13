import type { Collection } from '@kawsay/contracts/records';
import * as schema from '../db/schema';

/** The local table behind each synced collection (ADR 0018); collection names are the table names. */
export const SYNCED_TABLES = {
  profile: schema.profile,
  weight_entry: schema.weightEntry,
  waist_entry: schema.waistEntry,
  meal_entry: schema.mealEntry,
  activity_entry: schema.activityEntry,
  day_status: schema.dayStatus,
  sleep_session: schema.sleepSession,
  drink_entry: schema.drinkEntry,
  check_in: schema.checkIn,
  symptom: schema.symptom,
  symptom_entry: schema.symptomEntry,
  intimate_entry: schema.intimateEntry,
  routine: schema.routine,
  routine_exercise: schema.routineExercise,
  user_dish: schema.userDish,
  user_dish_item: schema.userDishItem,
  day_note: schema.dayNote,
  pending_meal: schema.pendingMeal,
  user_food: schema.userFood,
} satisfies Record<Collection, unknown>;

/**
 * Collections that keep one live record per key: two phones can each create "the same" one with different ids.
 * An empty key means one record in total (the profile).
 */
export const NATURAL_KEYS: Partial<Record<Collection, readonly string[]>> = {
  profile: [],
  weight_entry: ['date'],
  waist_entry: ['weekStart'],
  day_status: ['date'],
};
