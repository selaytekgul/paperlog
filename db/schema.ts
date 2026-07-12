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
  abstract: text("abstract").notNull().default(""),
  citedByCount: integer("cited_by_count").notNull().default(0),
  arxivId: text("arxiv_id"),
  openReviewId: text("openreview_id"),
  normalizedTitle: text("normalized_title"),
  metadataUpdatedAt: text("metadata_updated_at"),
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
  bio: text("bio").notNull().default(""),
  affiliation: text("affiliation").notNull().default(""),
  interestsJson: text("interests_json").notNull().default("[]"),
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

export const follows = sqliteTable("follows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  followerEmail: text("follower_email").notNull(),
  followingEmail: text("following_email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("follows_pair_unique").on(table.followerEmail, table.followingEmail)]);

export const helpfulVotes = sqliteTable("helpful_votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id").notNull().references(() => logs.id),
  userEmail: text("user_email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("helpful_log_user_unique").on(table.logId, table.userEmail)]);

export const replies = sqliteTable("replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id").notNull().references(() => logs.id),
  paperId: text("paper_id").notNull().references(() => papers.id),
  userEmail: text("user_email").notNull(),
  displayName: text("display_name").notNull(),
  comment: text("comment").notNull(),
  authorResponse: integer("author_response", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("replies_log_idx").on(table.logId, table.createdAt)]);

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull(),
  actorEmail: text("actor_email").notNull(),
  type: text("type").notNull(),
  paperId: text("paper_id"),
  logId: integer("log_id"),
  replyId: integer("reply_id"),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("notifications_user_idx").on(table.userEmail, table.createdAt)]);

export const paperLists = sqliteTable("paper_lists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("lists_user_name_unique").on(table.userEmail, table.name)]);

export const paperListItems = sqliteTable("paper_list_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listId: integer("list_id").notNull().references(() => paperLists.id),
  paperId: text("paper_id").notNull().references(() => papers.id),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("list_paper_unique").on(table.listId, table.paperId)]);

export const codeExperiences = sqliteTable("code_experiences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paperId: text("paper_id").notNull().references(() => papers.id),
  userEmail: text("user_email").notNull(),
  displayName: text("display_name").notNull(),
  repositoryUrl: text("repository_url").notNull(),
  commitRef: text("commit_ref").notNull().default(""),
  environment: text("environment").notNull().default(""),
  dataset: text("dataset").notNull().default(""),
  outcome: text("outcome").notNull(),
  reproducibilityRating: integer("reproducibility_rating"),
  notes: text("notes").notNull().default(""),
  artifactUrl: text("artifact_url"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("code_user_paper_unique").on(table.userEmail, table.paperId)]);

export const metadataCorrections = sqliteTable("metadata_corrections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paperId: text("paper_id").notNull(),
  reporterEmail: text("reporter_email").notNull(),
  field: text("field").notNull(),
  suggestedValue: text("suggested_value").notNull(),
  evidenceUrl: text("evidence_url"),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const moderationActions = sqliteTable("moderation_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  details: text("details").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const authorClaims = sqliteTable("author_claims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paperId: text("paper_id").notNull(),
  userEmail: text("user_email").notNull(),
  evidenceUrl: text("evidence_url").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  reviewedAt: text("reviewed_at"),
}, (table) => [uniqueIndex("author_claim_user_paper_unique").on(table.userEmail, table.paperId)]);
