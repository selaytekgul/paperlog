import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const papers = sqliteTable("papers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  authorsJson: text("authors_json").notNull().default("[]"),
  publicationYear: integer("publication_year"),
  venue: text("venue").notNull().default("Research paper"),
  doi: text("doi"),
  landingPageUrl: text("landing_page_url"),
  pdfUrl: text("pdf_url"),
  topic: text("topic").notNull().default("Research"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const logs = sqliteTable("logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paperId: text("paper_id").notNull().references(() => papers.id),
  userEmail: text("user_email").notNull(),
  displayName: text("display_name").notNull(),
  rating: integer("rating"),
  status: text("status").notNull().default("read"),
  comment: text("comment").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("logs_user_paper_unique").on(table.userEmail, table.paperId)]);

export const profiles = sqliteTable("profiles", {
  userEmail: text("user_email").primaryKey(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const readingEntries = sqliteTable("reading_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paperId: text("paper_id").notNull().references(() => papers.id),
  userEmail: text("user_email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("reading_user_paper_unique").on(table.userEmail, table.paperId)]);

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id").notNull().references(() => logs.id),
  reporterEmail: text("reporter_email").notNull(),
  reason: text("reason").notNull(),
  details: text("details").notNull().default(""),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("reports_reporter_log_unique").on(table.reporterEmail, table.logId)]);

export const contactRequests = sqliteTable("contact_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const activityEvents = sqliteTable("activity_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorHash: text("actor_hash").notNull(),
  action: text("action").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("activity_actor_action_idx").on(table.actorHash, table.action, table.createdAt)]);
