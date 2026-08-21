CREATE TABLE `contact_emails` (
	`github_id` integer PRIMARY KEY NOT NULL,
	`github_login` text NOT NULL,
	`email` text NOT NULL,
	`updated_at` integer NOT NULL
);
