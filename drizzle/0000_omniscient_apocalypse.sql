CREATE TABLE `cache_metadata` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`last_updated` text NOT NULL,
	`record_count` integer,
	`source_file` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cache_metadata_key_unique` ON `cache_metadata` (`key`);--> statement-breakpoint
CREATE TABLE `cluster_keywords` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cluster_id` integer NOT NULL,
	`keyword` text NOT NULL,
	`frequency` real NOT NULL,
	`rank` integer NOT NULL,
	FOREIGN KEY (`cluster_id`) REFERENCES `clusters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cluster_keywords_cluster_idx` ON `cluster_keywords` (`cluster_id`);--> statement-breakpoint
CREATE TABLE `clusters` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`count` integer DEFAULT 0 NOT NULL,
	`percentage` real DEFAULT 0 NOT NULL,
	`color` text,
	`centroid_lat` real,
	`centroid_lng` real,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `energy_stats_by_zip` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`zip_code` text NOT NULL,
	`total_energy_permits` integer DEFAULT 0 NOT NULL,
	`solar` integer DEFAULT 0 NOT NULL,
	`battery` integer DEFAULT 0 NOT NULL,
	`ev_charger` integer DEFAULT 0 NOT NULL,
	`generator` integer DEFAULT 0 NOT NULL,
	`panel_upgrade` integer DEFAULT 0 NOT NULL,
	`hvac` integer DEFAULT 0 NOT NULL,
	`total_solar_capacity_kw` real DEFAULT 0,
	`avg_solar_capacity_kw` real DEFAULT 0,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `energy_stats_by_zip_zip_code_unique` ON `energy_stats_by_zip` (`zip_code`);--> statement-breakpoint
CREATE INDEX `energy_stats_zip_idx` ON `energy_stats_by_zip` (`zip_code`);--> statement-breakpoint
CREATE TABLE `permits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`permit_number` text NOT NULL,
	`address` text,
	`zip_code` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`cluster_id` integer,
	`work_description` text,
	`is_energy_permit` integer DEFAULT false,
	`energy_type` text,
	`solar_capacity_kw` real,
	`issue_date` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permits_permit_number_unique` ON `permits` (`permit_number`);--> statement-breakpoint
CREATE INDEX `zip_idx` ON `permits` (`zip_code`);--> statement-breakpoint
CREATE INDEX `cluster_idx` ON `permits` (`cluster_id`);--> statement-breakpoint
CREATE INDEX `energy_type_idx` ON `permits` (`energy_type`);--> statement-breakpoint
CREATE INDEX `issue_date_idx` ON `permits` (`issue_date`);--> statement-breakpoint
CREATE TABLE `trends` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`period_type` text NOT NULL,
	`total_permits` integer DEFAULT 0 NOT NULL,
	`energy_permits` integer DEFAULT 0 NOT NULL,
	`solar` integer DEFAULT 0 NOT NULL,
	`battery` integer DEFAULT 0 NOT NULL,
	`ev_charger` integer DEFAULT 0 NOT NULL,
	`growth_rate` real,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `trends_period_idx` ON `trends` (`period`);--> statement-breakpoint
CREATE INDEX `trends_period_type_idx` ON `trends` (`period_type`);