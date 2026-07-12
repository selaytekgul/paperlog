CREATE TABLE `code_experiences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`paper_id` text NOT NULL,
	`user_email` text NOT NULL,
	`display_name` text NOT NULL,
	`repository_url` text NOT NULL,
	`commit_ref` text DEFAULT '' NOT NULL,
	`environment` text DEFAULT '' NOT NULL,
	`dataset` text DEFAULT '' NOT NULL,
	`outcome` text NOT NULL,
	`reproducibility_rating` integer,
	`notes` text DEFAULT '' NOT NULL,
	`artifact_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`paper_id`) REFERENCES `papers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `code_user_paper_unique` ON `code_experiences` (`user_email`,`paper_id`);--> statement-breakpoint
CREATE TABLE `follows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`follower_email` text NOT NULL,
	`following_email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `follows_pair_unique` ON `follows` (`follower_email`,`following_email`);--> statement-breakpoint
CREATE TABLE `helpful_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`log_id` integer NOT NULL,
	`user_email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`log_id`) REFERENCES `logs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `helpful_log_user_unique` ON `helpful_votes` (`log_id`,`user_email`);--> statement-breakpoint
CREATE TABLE `metadata_corrections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`paper_id` text NOT NULL,
	`reporter_email` text NOT NULL,
	`field` text NOT NULL,
	`suggested_value` text NOT NULL,
	`evidence_url` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `moderation_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_email` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`actor_email` text NOT NULL,
	`type` text NOT NULL,
	`paper_id` text,
	`log_id` integer,
	`reply_id` integer,
	`read_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_email`,`created_at`);--> statement-breakpoint
CREATE TABLE `paper_list_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list_id` integer NOT NULL,
	`paper_id` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `paper_lists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paper_id`) REFERENCES `papers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `list_paper_unique` ON `paper_list_items` (`list_id`,`paper_id`);--> statement-breakpoint
CREATE TABLE `paper_lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lists_user_name_unique` ON `paper_lists` (`user_email`,`name`);--> statement-breakpoint
CREATE TABLE `replies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`log_id` integer NOT NULL,
	`paper_id` text NOT NULL,
	`user_email` text NOT NULL,
	`display_name` text NOT NULL,
	`comment` text NOT NULL,
	`author_response` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`log_id`) REFERENCES `logs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paper_id`) REFERENCES `papers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `replies_log_idx` ON `replies` (`log_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `papers` ADD `arxiv_id` text;--> statement-breakpoint
ALTER TABLE `papers` ADD `openreview_id` text;--> statement-breakpoint
ALTER TABLE `papers` ADD `normalized_title` text;--> statement-breakpoint
ALTER TABLE `papers` ADD `metadata_updated_at` text;--> statement-breakpoint
ALTER TABLE `profiles` ADD `bio` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `affiliation` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `interests_json` text DEFAULT '[]' NOT NULL;