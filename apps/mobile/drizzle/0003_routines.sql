CREATE TABLE `routine` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`rest_seconds` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routine_exercise` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`routine_id` text NOT NULL,
	`position` integer NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`sets` integer,
	`reps` integer,
	`seconds_per_rep` real,
	`seconds` integer,
	`laps` integer,
	`lap_seconds` integer,
	`minutes` real,
	`intensity` text,
	`per_side` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `routine_exercise_by_routine` ON `routine_exercise` (`routine_id`);