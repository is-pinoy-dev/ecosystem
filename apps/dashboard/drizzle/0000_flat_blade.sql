CREATE TABLE "subdomains" (
	"name" text PRIMARY KEY NOT NULL,
	"owner_github" text NOT NULL,
	"owner_email" text,
	"records" jsonb NOT NULL,
	"sync_status" text DEFAULT 'pending' NOT NULL,
	"last_error" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "subdomains_owner_github_idx" ON "subdomains" USING btree ("owner_github");