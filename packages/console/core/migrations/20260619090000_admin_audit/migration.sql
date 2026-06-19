CREATE TABLE `admin_audit` (
	`id` varchar(30) NOT NULL,
	`time_created` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`time_updated` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`time_deleted` timestamp(3),
	`admin_account_id` varchar(30) NOT NULL,
	`admin_login` varchar(255) NOT NULL,
	`action` varchar(64) NOT NULL,
	`target_type` varchar(32) NOT NULL,
	`target_id` varchar(255) NOT NULL,
	`workspace_id` varchar(30),
	`user_id` varchar(30),
	`account_id` varchar(30),
	`reason` varchar(512) NOT NULL,
	`before_snapshot` json,
	`after_snapshot` json,
	`request_metadata` json,
	CONSTRAINT `admin_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `admin_account_id` ON `admin_audit` (`admin_account_id`);
--> statement-breakpoint
CREATE INDEX `target` ON `admin_audit` (`target_type`,`target_id`);
--> statement-breakpoint
CREATE INDEX `workspace_id` ON `admin_audit` (`workspace_id`);
