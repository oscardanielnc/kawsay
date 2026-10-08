CREATE TABLE `intimate_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`time_zone` text NOT NULL,
	`kind` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `intimate_entry_by_date` ON `intimate_entry` (`date`);