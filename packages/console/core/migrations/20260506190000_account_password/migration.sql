CREATE TABLE `account_password` (
	`account_id` varchar(30) NOT NULL,
	`time_created` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`time_updated` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`time_deleted` timestamp(3),
	`password_hash` varchar(255) NOT NULL,
	`password_algorithm` varchar(32) NOT NULL,
	`time_password_updated` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`failed_attempt_count` int NOT NULL DEFAULT 0,
	`locked_until` timestamp(3),
	CONSTRAINT `account_password_account_id` PRIMARY KEY(`account_id`)
);
