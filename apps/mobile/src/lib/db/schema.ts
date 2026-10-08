import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

/**
 * Local database (ADR 0004). Every synced record carries a device-generated UUIDv7 `id`, `updatedAt` (ms UTC, last
 * write wins) and `deletedAt` (tombstone). Dated entries also keep the local calendar day, the instant and the time
 * zone they were logged in (ADR 0016). Catalog tables hold the bundled seed and are not synced.
 */
const synced = {
  id: text('id').primaryKey(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
};
const dated = {
  date: text('date').notNull(),
  loggedAt: integer('logged_at').notNull(),
  timeZone: text('time_zone').notNull(),
};

export const profile = sqliteTable('profile', {
  ...synced,
  sex: text('sex', { enum: ['male', 'female'] }).notNull(),
  heightCm: real('height_cm').notNull(),
  ageYears: integer('age_years').notNull(),
  /** Day the age was entered; the app ages it from there. */
  ageSetOn: text('age_set_on').notNull(),
  goalWeightKg: real('goal_weight_kg'),
  goalDate: text('goal_date'),
  climate: text('climate', { enum: ['warm', 'temperate', 'cold'] }).notNull(),
  proteinGPerKg: real('protein_g_per_kg').notNull(),
  fatShare: real('fat_share').notNull(),
  movementGoalMin: integer('movement_goal_min').notNull(),
  /** Usual schedule as local "HH:MM", to prefill sleep (F11). */
  usualSleepStart: text('usual_sleep_start').notNull(),
  usualSleepEnd: text('usual_sleep_end').notNull(),
  usualNapStart: text('usual_nap_start'),
  usualNapEnd: text('usual_nap_end'),
  /** Optional modules (F01 "what to log"); the six core ones are always on. */
  waistEnabled: integer('waist_enabled', { mode: 'boolean' }).notNull().default(false),
  /** 0 = Monday … 6 = Sunday, for the weekly waist reminder (F04). */
  waistReminderDay: integer('waist_reminder_day'),
  symptomsEnabled: integer('symptoms_enabled', { mode: 'boolean' }).notNull().default(false),
  intimateEnabled: integer('intimate_enabled', { mode: 'boolean' }).notNull().default(false),
  /** Recalibration factor (ADR 0009). */
  expenditureFactor: real('expenditure_factor').notNull(),
});

export const weightEntry = sqliteTable(
  'weight_entry',
  { ...synced, ...dated, kg: real('kg').notNull() },
  (t) => [
    // F03: one weight per day; a tombstoned row does not block a new one.
    uniqueIndex('weight_entry_one_per_day')
      .on(t.date)
      .where(sql`deleted_at is null`),
  ],
);

export const mealEntry = sqliteTable(
  'meal_entry',
  {
    ...synced,
    ...dated,
    meal: text('meal', { enum: ['breakfast', 'lunch', 'dinner', 'snack'] }).notNull(),
    dishId: text('dish_id'),
    foodId: text('food_id'),
    /** Portions of the dish or food (¼ … 2), or grams when given in grams (F05). */
    servings: real('servings'),
    grams: real('grams'),
    /** Drinks logged as food also count toward hydration (F05, F10). */
    volumeMl: real('volume_ml'),
  },
  (t) => [index('meal_entry_by_date').on(t.date)],
);

export const activityEntry = sqliteTable(
  'activity_entry',
  {
    ...synced,
    ...dated,
    kind: text('kind').notNull(),
    intensity: text('intensity', { enum: ['light', 'medium', 'hard'] }),
    minutes: real('minutes').notNull(),
    /**
     * MET of the block. A routine session stores its time-weighted MET, so editing the routine later does not change
     * sessions already logged (F18) and the kcal still follow the day's BMR.
     */
    met: real('met').notNull(),
    routineId: text('routine_id'),
    timeBand: text('time_band', { enum: ['morning', 'midday', 'afternoon', 'evening', 'night'] }),
  },
  (t) => [index('activity_entry_by_date').on(t.date)],
);

/** Per-day flags: "No physical activity" (F08) and "I sweated a lot today" (F10). */
export const dayStatus = sqliteTable(
  'day_status',
  {
    ...synced,
    date: text('date').notNull(),
    noActivity: integer('no_activity', { mode: 'boolean' }).notNull(),
    sweatedALot: integer('sweated_a_lot', { mode: 'boolean' }).notNull(),
  },
  (t) => [
    uniqueIndex('day_status_one_per_day')
      .on(t.date)
      .where(sql`deleted_at is null`),
  ],
);

export const sleepSession = sqliteTable(
  'sleep_session',
  {
    ...synced,
    /** Day the session counts for: the day you woke up. */
    date: text('date').notNull(),
    kind: text('kind', { enum: ['night', 'nap'] }).notNull(),
    /** Local wall-clock times "YYYY-MM-DDTHH:MM" plus the zone they were in. */
    start: text('start').notNull(),
    end: text('end').notNull(),
    timeZone: text('time_zone').notNull(),
    quality: integer('quality'),
    nightmares: integer('nightmares', { mode: 'boolean' }).notNull(),
  },
  (t) => [index('sleep_session_by_date').on(t.date)],
);

export const drinkEntry = sqliteTable(
  'drink_entry',
  {
    ...synced,
    ...dated,
    kind: text('kind', { enum: ['water', 'zero-calorie', 'alcohol'] }).notNull(),
    volumeMl: real('volume_ml').notNull(),
  },
  (t) => [index('drink_entry_by_date').on(t.date)],
);

// Catalog (ADR 0014): loaded from @kawsay/catalog, replaced when its version changes. Not synced.

export const food = sqliteTable('food', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  state: text('state').notNull(),
  sourceKind: text('source_kind').notNull(),
  sourceCode: text('source_code'),
  /** Nutrients per 100 g as eaten; null while the food waits for a label or a match. */
  per100g: text('per_100g', { mode: 'json' }).$type<Record<string, number | null> | null>(),
});

export const foodUnit = sqliteTable(
  'food_unit',
  {
    foodId: text('food_id').notNull(),
    label: text('label').notNull(),
    grams: real('grams'),
    position: integer('position').notNull(),
  },
  (t) => [index('food_unit_by_food').on(t.foodId)],
);

export const dish = sqliteTable('dish', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  group: text('group').notNull(),
  icon: text('icon').notNull(),
  serving: text('serving').notNull(),
  servings: real('servings').notNull(),
  /** null for seed dishes; user dishes (F07) arrive with their own synced table. */
  owner: text('owner'),
});

export const dishItem = sqliteTable(
  'dish_item',
  {
    dishId: text('dish_id').notNull(),
    foodId: text('food_id').notNull(),
    grams: real('grams').notNull(),
    position: integer('position').notNull(),
  },
  (t) => [index('dish_item_by_dish').on(t.dishId)],
);

/** Key/value facts about the local database, e.g. the catalog version loaded. */
export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
