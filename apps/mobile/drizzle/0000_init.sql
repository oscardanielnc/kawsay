CREATE TABLE `activity_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`time_zone` text NOT NULL,
	`kind` text NOT NULL,
	`intensity` text,
	`minutes` real NOT NULL,
	`met` real NOT NULL,
	`routine_id` text,
	`time_band` text
);
--> statement-breakpoint
CREATE INDEX `activity_entry_by_date` ON `activity_entry` (`date`);--> statement-breakpoint
CREATE TABLE `day_status` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`no_activity` integer NOT NULL,
	`sweated_a_lot` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `day_status_one_per_day` ON `day_status` (`date`) WHERE deleted_at is null;--> statement-breakpoint
CREATE TABLE `dish` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`group` text NOT NULL,
	`icon` text NOT NULL,
	`serving` text NOT NULL,
	`servings` real NOT NULL,
	`owner` text
);
--> statement-breakpoint
CREATE TABLE `dish_item` (
	`dish_id` text NOT NULL,
	`food_id` text NOT NULL,
	`grams` real NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `dish_item_by_dish` ON `dish_item` (`dish_id`);--> statement-breakpoint
CREATE TABLE `drink_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`time_zone` text NOT NULL,
	`kind` text NOT NULL,
	`volume_ml` real NOT NULL
);
--> statement-breakpoint
CREATE INDEX `drink_entry_by_date` ON `drink_entry` (`date`);--> statement-breakpoint
CREATE TABLE `food` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`state` text NOT NULL,
	`source_kind` text NOT NULL,
	`source_code` text,
	`per_100g` text
);
--> statement-breakpoint
CREATE TABLE `food_unit` (
	`food_id` text NOT NULL,
	`label` text NOT NULL,
	`grams` real,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `food_unit_by_food` ON `food_unit` (`food_id`);--> statement-breakpoint
CREATE TABLE `meal_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`time_zone` text NOT NULL,
	`meal` text NOT NULL,
	`dish_id` text,
	`food_id` text,
	`servings` real,
	`grams` real,
	`volume_ml` real
);
--> statement-breakpoint
CREATE INDEX `meal_entry_by_date` ON `meal_entry` (`date`);--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sex` text NOT NULL,
	`height_cm` real NOT NULL,
	`age_years` integer NOT NULL,
	`age_set_on` text NOT NULL,
	`goal_weight_kg` real,
	`goal_date` text,
	`climate` text NOT NULL,
	`protein_g_per_kg` real NOT NULL,
	`fat_share` real NOT NULL,
	`movement_goal_min` integer NOT NULL,
	`usual_sleep_start` text NOT NULL,
	`usual_sleep_end` text NOT NULL,
	`expenditure_factor` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sleep_session` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`time_zone` text NOT NULL,
	`quality` integer,
	`nightmares` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sleep_session_by_date` ON `sleep_session` (`date`);--> statement-breakpoint
CREATE TABLE `weight_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`time_zone` text NOT NULL,
	`kg` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weight_entry_one_per_day` ON `weight_entry` (`date`) WHERE deleted_at is null;