CREATE TABLE `sync_outbox` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collection` text NOT NULL,
	`record_id` text NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER `profile_outbox_insert` AFTER INSERT ON `profile`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('profile', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `profile_outbox_update` AFTER UPDATE ON `profile`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('profile', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `weight_entry_outbox_insert` AFTER INSERT ON `weight_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('weight_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `weight_entry_outbox_update` AFTER UPDATE ON `weight_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('weight_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `waist_entry_outbox_insert` AFTER INSERT ON `waist_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('waist_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `waist_entry_outbox_update` AFTER UPDATE ON `waist_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('waist_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `meal_entry_outbox_insert` AFTER INSERT ON `meal_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('meal_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `meal_entry_outbox_update` AFTER UPDATE ON `meal_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('meal_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `activity_entry_outbox_insert` AFTER INSERT ON `activity_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('activity_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `activity_entry_outbox_update` AFTER UPDATE ON `activity_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('activity_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `day_status_outbox_insert` AFTER INSERT ON `day_status`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('day_status', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `day_status_outbox_update` AFTER UPDATE ON `day_status`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('day_status', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `sleep_session_outbox_insert` AFTER INSERT ON `sleep_session`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('sleep_session', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `sleep_session_outbox_update` AFTER UPDATE ON `sleep_session`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('sleep_session', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `drink_entry_outbox_insert` AFTER INSERT ON `drink_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('drink_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `drink_entry_outbox_update` AFTER UPDATE ON `drink_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('drink_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `check_in_outbox_insert` AFTER INSERT ON `check_in`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('check_in', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `check_in_outbox_update` AFTER UPDATE ON `check_in`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('check_in', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `symptom_outbox_insert` AFTER INSERT ON `symptom`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('symptom', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `symptom_outbox_update` AFTER UPDATE ON `symptom`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('symptom', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `symptom_entry_outbox_insert` AFTER INSERT ON `symptom_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('symptom_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `symptom_entry_outbox_update` AFTER UPDATE ON `symptom_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('symptom_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `intimate_entry_outbox_insert` AFTER INSERT ON `intimate_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('intimate_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `intimate_entry_outbox_update` AFTER UPDATE ON `intimate_entry`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('intimate_entry', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `routine_outbox_insert` AFTER INSERT ON `routine`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('routine', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `routine_outbox_update` AFTER UPDATE ON `routine`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('routine', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `routine_exercise_outbox_insert` AFTER INSERT ON `routine_exercise`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('routine_exercise', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `routine_exercise_outbox_update` AFTER UPDATE ON `routine_exercise`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('routine_exercise', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `user_dish_outbox_insert` AFTER INSERT ON `user_dish`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('user_dish', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `user_dish_outbox_update` AFTER UPDATE ON `user_dish`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('user_dish', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `user_dish_item_outbox_insert` AFTER INSERT ON `user_dish_item`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('user_dish_item', NEW.`id`);
END;
--> statement-breakpoint
CREATE TRIGGER `user_dish_item_outbox_update` AFTER UPDATE ON `user_dish_item`
WHEN NOT EXISTS (SELECT 1 FROM `meta` WHERE `key` = 'sync.applying')
BEGIN
	INSERT INTO `sync_outbox` (`collection`, `record_id`) VALUES ('user_dish_item', NEW.`id`);
END;
--> statement-breakpoint
-- Records written before sync existed are pushed on the first sync.
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'profile', `id` FROM `profile`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'weight_entry', `id` FROM `weight_entry`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'waist_entry', `id` FROM `waist_entry`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'meal_entry', `id` FROM `meal_entry`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'activity_entry', `id` FROM `activity_entry`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'day_status', `id` FROM `day_status`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'sleep_session', `id` FROM `sleep_session`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'drink_entry', `id` FROM `drink_entry`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'check_in', `id` FROM `check_in`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'symptom', `id` FROM `symptom`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'symptom_entry', `id` FROM `symptom_entry`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'intimate_entry', `id` FROM `intimate_entry`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'routine', `id` FROM `routine`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'routine_exercise', `id` FROM `routine_exercise`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'user_dish', `id` FROM `user_dish`;
--> statement-breakpoint
INSERT INTO `sync_outbox` (`collection`, `record_id`) SELECT 'user_dish_item', `id` FROM `user_dish_item`;
