CREATE TABLE `logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`paper_id` text NOT NULL,
	`user_email` text NOT NULL,
	`display_name` text NOT NULL,
	`rating` integer,
	`status` text DEFAULT 'read' NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`paper_id`) REFERENCES `papers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `logs_user_paper_unique` ON `logs` (`user_email`,`paper_id`);--> statement-breakpoint
CREATE TABLE `papers` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`authors_json` text DEFAULT '[]' NOT NULL,
	`publication_year` integer,
	`venue` text DEFAULT 'Research paper' NOT NULL,
	`doi` text,
	`landing_page_url` text,
	`pdf_url` text,
	`topic` text DEFAULT 'Research' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
