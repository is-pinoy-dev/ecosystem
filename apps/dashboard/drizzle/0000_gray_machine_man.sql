CREATE TABLE `subdomains` (
	`name` text PRIMARY KEY NOT NULL,
	`owner_github` text NOT NULL,
	`owner_email` text,
	`records` text NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_error` text,
	`last_synced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `subdomains_owner_github_idx` ON `subdomains` (`owner_github`);