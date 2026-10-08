CREATE TABLE `check_in` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`time_zone` text NOT NULL,
	`kind` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `check_in_by_date` ON `check_in` (`date`);