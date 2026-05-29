CREATE TABLE `workbench_project` (
	`workspace_id` varchar(30) NOT NULL,
	`id` varchar(30) NOT NULL,
	`name` varchar(255) NOT NULL,
	`source_type` enum('local_folder','git_public','empty') NOT NULL,
	`source_label` varchar(2048) NOT NULL,
	`directory` varchar(512) NOT NULL,
	`sync_mode` enum('manual','auto') NOT NULL DEFAULT 'manual',
	`time_created` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`time_updated` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`time_deleted` timestamp(3),
	CONSTRAINT `workbench_project_workspace_id_id` PRIMARY KEY(`workspace_id`,`id`),
	CONSTRAINT `workbench_project_directory` UNIQUE(`workspace_id`,`directory`)
);
