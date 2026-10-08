ALTER TABLE `profile` ADD `usual_nap_start` text;--> statement-breakpoint
ALTER TABLE `profile` ADD `usual_nap_end` text;--> statement-breakpoint
ALTER TABLE `profile` ADD `waist_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `waist_reminder_day` integer;--> statement-breakpoint
ALTER TABLE `profile` ADD `symptoms_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `intimate_enabled` integer DEFAULT false NOT NULL;