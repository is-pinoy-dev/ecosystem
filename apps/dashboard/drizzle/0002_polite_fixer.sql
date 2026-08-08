ALTER TABLE `subdomains` ADD `screenshot_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `subdomains` ADD `screenshot_key` text;--> statement-breakpoint
ALTER TABLE `subdomains` ADD `screenshot_url` text;--> statement-breakpoint
ALTER TABLE `subdomains` ADD `screenshot_captured_at` integer;--> statement-breakpoint
ALTER TABLE `subdomains` ADD `screenshot_requested_at` integer;--> statement-breakpoint
ALTER TABLE `subdomains` ADD `screenshot_failure_reason` text;--> statement-breakpoint
ALTER TABLE `subdomains` ADD `screenshot_retry_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subdomains` ADD `screenshot_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `subdomains_screenshot_status_idx` ON `subdomains` (`screenshot_status`);--> statement-breakpoint
CREATE INDEX `subdomains_screenshot_captured_at_idx` ON `subdomains` (`screenshot_captured_at`);--> statement-breakpoint
CREATE INDEX `subdomains_screenshot_refresh_eligible_idx` ON `subdomains` (`screenshot_status`,`screenshot_captured_at`,`screenshot_requested_at`);