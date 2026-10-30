CREATE TABLE `pending_meal` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`time_zone` text NOT NULL,
	`meal` text NOT NULL,
	`name` text NOT NULL,
	`portion` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pending_meal_by_date` ON `pending_meal` (`date`);--> statement-breakpoint
ALTER TABLE `dish` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `food` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `food` ADD `generic` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE TRIGGER `pending_meal_outbox_insert` AFTER INSERT ON `pending_meal`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('pending_meal', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `pending_meal_outbox_update` AFTER UPDATE ON `pending_meal`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('pending_meal', NEW.`id`);
END;
