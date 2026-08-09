ALTER TABLE `subdomains` ADD `owner_id` integer;--> statement-breakpoint
CREATE INDEX `subdomains_owner_id_idx` ON `subdomains` (`owner_id`);