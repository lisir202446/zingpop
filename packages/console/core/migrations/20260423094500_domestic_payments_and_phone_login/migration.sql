ALTER TABLE `auth`
MODIFY COLUMN `provider` enum('email','github','google','phone') NOT NULL;
--> statement-breakpoint
CREATE TABLE `login_code` (
	`id` varchar(30) NOT NULL,
	`time_created` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`time_updated` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`time_deleted` timestamp(3),
	`phone` varchar(16) NOT NULL,
	`code_hash` varchar(64) NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`used_at` timestamp(3),
	`attempt_count` int NOT NULL DEFAULT 0,
	`ip` varchar(64),
	CONSTRAINT `login_code_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `phone` ON `login_code` (`phone`);
--> statement-breakpoint
CREATE INDEX `phone_created` ON `login_code` (`phone`,`time_created`);
--> statement-breakpoint
ALTER TABLE `payment`
ADD COLUMN `order_id` varchar(64),
ADD COLUMN `channel` enum('alipay','wechat'),
ADD COLUMN `status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
ADD COLUMN `receipt_url` varchar(1024),
ADD COLUMN `paid_amount` bigint,
ADD COLUMN `time_paid` timestamp(3),
ADD COLUMN `notify_payload` json;
--> statement-breakpoint
UPDATE `payment`
SET
	`order_id` = `id`,
	`status` = CASE
		WHEN `time_refunded` IS NOT NULL THEN 'refunded'
		ELSE 'paid'
	END,
	`time_paid` = `time_created`
WHERE `order_id` IS NULL;
