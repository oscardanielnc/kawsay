CREATE TABLE `lab_result` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`ast` real NOT NULL,
	`alt` real NOT NULL,
	`platelets` real NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `drink_entry` ADD `alcohol_kind` text;--> statement-breakpoint
ALTER TABLE `drink_entry` ADD `abv` real;--> statement-breakpoint
ALTER TABLE `profile` ADD `liver_enabled` integer;