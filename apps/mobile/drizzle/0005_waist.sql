CREATE TABLE `waist_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`time_zone` text NOT NULL,
	`week_start` text NOT NULL,
	`cm` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waist_entry_one_per_week` ON `waist_entry` (`week_start`) WHERE deleted_at is null;