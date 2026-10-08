CREATE TABLE `user_dish` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`servings` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_dish_item` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`user_dish_id` text NOT NULL,
	`food_id` text NOT NULL,
	`grams` real NOT NULL,
	`unit_label` text,
	`unit_count` real,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `user_dish_item_by_dish` ON `user_dish_item` (`user_dish_id`);