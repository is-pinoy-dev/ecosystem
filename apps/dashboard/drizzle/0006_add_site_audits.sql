CREATE TABLE `site_audits` (
	`subdomain` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`seo` text NOT NULL,
	`og` text NOT NULL,
	`psi` text,
	`audited_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
