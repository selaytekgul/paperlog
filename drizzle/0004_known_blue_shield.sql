ALTER TABLE `papers` ADD `abstract` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `papers` ADD `cited_by_count` integer DEFAULT 0 NOT NULL;