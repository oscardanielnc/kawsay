import { z } from 'zod';

/**
 * Every synced record type, keyed by its table name on the phone (ADR 0018). Field names are the phone's Drizzle
 * property names; a mobile test checks both sides list the same fields.
 */

const ms = z.number().int().nonnegative();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
const clock = z.string().regex(/^\d{2}:\d{2}$/, 'must be HH:MM');
const wallTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'must be YYYY-MM-DDTHH:MM');
const text = z.string().min(1).max(200);
const ref = z.string().min(1).max(100);
const amount = z.number().nonnegative();
const intensity = z.enum(['light', 'medium', 'hard']);

const synced = { id: z.uuid(), updatedAt: ms, deletedAt: ms.nullable() };
const dated = { date: day, loggedAt: ms, timeZone: z.string().min(1).max(64) };

export const RECORD_SCHEMAS = {
  profile: z.strictObject({
    ...synced,
    sex: z.enum(['male', 'female']),
    heightCm: amount,
    ageYears: z.number().int().nonnegative(),
    ageSetOn: day,
    goalWeightKg: amount.nullable(),
    goalDate: day.nullable(),
    climate: z.enum(['warm', 'temperate', 'cold']),
    proteinGPerKg: amount,
    fatShare: amount,
    movementGoalMin: z.number().int().nonnegative(),
    usualSleepStart: clock,
    usualSleepEnd: clock,
    usualNapStart: clock.nullable(),
    usualNapEnd: clock.nullable(),
    waistEnabled: z.boolean(),
    waistReminderDay: z.number().int().min(0).max(6).nullable(),
    symptomsEnabled: z.boolean(),
    intimateEnabled: z.boolean(),
    expenditureFactor: amount,
  }),
  weight_entry: z.strictObject({ ...synced, ...dated, kg: amount }),
  waist_entry: z.strictObject({ ...synced, ...dated, weekStart: day, cm: amount }),
  meal_entry: z.strictObject({
    ...synced,
    ...dated,
    meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    dishId: ref.nullable(),
    foodId: ref.nullable(),
    servings: amount.nullable(),
    grams: amount.nullable(),
    volumeMl: amount.nullable(),
    leftoverOf: ref.nullable(),
  }),
  activity_entry: z.strictObject({
    ...synced,
    ...dated,
    kind: ref,
    intensity: intensity.nullable(),
    minutes: amount,
    met: amount,
    routineId: ref.nullable(),
    timeBand: z.enum(['early', 'morning', 'midday', 'afternoon', 'night']).nullable(),
  }),
  day_status: z.strictObject({
    ...synced,
    date: day,
    noActivity: z.boolean(),
    sweatedALot: z.boolean(),
  }),
  sleep_session: z.strictObject({
    ...synced,
    date: day,
    kind: z.enum(['night', 'nap']),
    start: wallTime,
    end: wallTime,
    timeZone: z.string().min(1).max(64),
    quality: z.number().int().min(1).max(5).nullable(),
    nightmares: z.boolean(),
  }),
  drink_entry: z.strictObject({
    ...synced,
    ...dated,
    kind: z.enum(['water', 'zero-calorie', 'alcohol']),
    volumeMl: amount,
  }),
  check_in: z.strictObject({
    ...synced,
    ...dated,
    kind: z.enum(['bathroom', 'bloating', 'stress', 'energy', 'mood', 'urine']),
    value: z.string().min(1).max(20),
  }),
  symptom: z.strictObject({
    ...synced,
    name: text,
    scale: z.enum(['yes-no', 'zero-five', 'size']),
  }),
  symptom_entry: z.strictObject({
    ...synced,
    ...dated,
    symptomId: ref,
    value: z.string().min(1).max(20),
  }),
  intimate_entry: z.strictObject({ ...synced, ...dated, kind: z.enum(['sex', 'masturbation']) }),
  routine: z.strictObject({
    ...synced,
    name: text,
    restSeconds: z.number().int().nonnegative(),
    // Optional: phones on an older version do not send it.
    byRounds: z.boolean().default(false),
  }),
  routine_exercise: z.strictObject({
    ...synced,
    routineId: ref,
    position: z.number().int().nonnegative(),
    name: text,
    kind: z.enum(['weights', 'bodyweight', 'circuit', 'isometric', 'stairs', 'mobility']),
    sets: z.number().int().nonnegative().nullable(),
    reps: z.number().int().nonnegative().nullable(),
    secondsPerRep: amount.nullable(),
    seconds: z.number().int().nonnegative().nullable(),
    laps: z.number().int().nonnegative().nullable(),
    lapSeconds: z.number().int().nonnegative().nullable(),
    minutes: amount.nullable(),
    intensity: intensity.nullable(),
    perSide: z.boolean(),
  }),
  user_dish: z.strictObject({ ...synced, name: text, icon: ref, servings: amount }),
  user_dish_item: z.strictObject({
    ...synced,
    userDishId: ref,
    foodId: ref,
    grams: amount,
    unitLabel: text.nullable(),
    unitCount: amount.nullable(),
    position: z.number().int().nonnegative(),
  }),
  pending_meal: z.strictObject({
    ...synced,
    ...dated,
    meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    name: text,
    portion: z.string().max(60),
  }),
  day_note: z.strictObject({ ...synced, ...dated, text: z.string().trim().min(1).max(4000) }),
};

export type Collection = keyof typeof RECORD_SCHEMAS;
export const COLLECTIONS = Object.keys(RECORD_SCHEMAS) as Collection[];
export type SyncedRecord<C extends Collection = Collection> = z.infer<(typeof RECORD_SCHEMAS)[C]>;
