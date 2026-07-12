CREATE TABLE `author_claims` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`paper_id` text NOT NULL,
	`user_email` text NOT NULL,
	`evidence_url` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `author_claim_user_paper_unique` ON `author_claims` (`user_email`,`paper_id`);