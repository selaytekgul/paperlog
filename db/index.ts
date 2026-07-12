import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

let initialized = false;

export async function ensureDbSchema() {
  if (initialized) return;
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS papers (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      authors_json TEXT NOT NULL DEFAULT '[]',
      publication_year INTEGER,
      venue TEXT NOT NULL DEFAULT 'Research paper',
      doi TEXT,
      landing_page_url TEXT,
      pdf_url TEXT,
      topic TEXT NOT NULL DEFAULT 'Research',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      paper_id TEXT NOT NULL REFERENCES papers(id),
      user_email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      rating INTEGER,
      status TEXT NOT NULL DEFAULT 'read',
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS logs_user_paper_unique ON logs(user_email, paper_id)"),
  ]);
  initialized = true;
}

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
