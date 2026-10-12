CREATE TABLE `day_note` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`time_zone` text NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `day_note_by_date` ON `day_note` (`date`);--> statement-breakpoint
CREATE TRIGGER `day_note_outbox_insert` AFTER INSERT ON `day_note`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('day_note', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `day_note_outbox_update` AFTER UPDATE ON `day_note`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('day_note', NEW.`id`);
END;
