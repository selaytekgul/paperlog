import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
