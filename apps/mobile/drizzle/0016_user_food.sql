CREATE TABLE `user_food` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`brand` text,
	`per_100g` text NOT NULL,
	`serving_label` text,
	`serving_grams` real,
	`package_grams` real,
	`is_drink` integer NOT NULL,
	`refined_flour` integer NOT NULL,
	`label_date` text NOT NULL,
	`read_by_ai` integer NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER `user_food_outbox_insert` AFTER INSERT ON `user_food`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('user_food', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `user_food_outbox_update` AFTER UPDATE ON `user_food`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('user_food', NEW.`id`);
END;
