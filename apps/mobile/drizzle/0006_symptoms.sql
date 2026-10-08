CREATE TABLE `symptom` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`scale` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `symptom_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`time_zone` text NOT NULL,
	`symptom_id` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `symptom_entry_by_date` ON `symptom_entry` (`date`);