import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

let initialized = false;
const runtimeEnv = env as unknown as { DB: D1Database };

export async function ensureDbSchema() {
  if (initialized) return;
  if (!runtimeEnv.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  await runtimeEnv.DB.batch([
    runtimeEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS papers (
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
    runtimeEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS logs (
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
    runtimeEnv.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS logs_user_paper_unique ON logs(user_email, paper_id)"),
    runtimeEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS profiles (
      user_email TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    runtimeEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS reading_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      paper_id TEXT NOT NULL REFERENCES papers(id),
      user_email TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    runtimeEnv.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS reading_user_paper_unique ON reading_entries(user_email, paper_id)"),
    runtimeEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      log_id INTEGER NOT NULL REFERENCES logs(id),
      reporter_email TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    runtimeEnv.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS reports_reporter_log_unique ON reports(reporter_email, log_id)"),
    runtimeEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS contact_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    runtimeEnv.DB.prepare(`CREATE TABLE IF NOT EXISTS activity_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      actor_hash TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    runtimeEnv.DB.prepare("CREATE INDEX IF NOT EXISTS activity_actor_action_idx ON activity_events(actor_hash, action, created_at)"),
  ]);
  initialized = true;
}

export async function rateLimit(actor: string, action: string, maximum: number, windowMinutes: number) {
  await ensureDbSchema();
  const encoded = new TextEncoder().encode(actor.toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const actorHash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const count = await runtimeEnv.DB.prepare("SELECT COUNT(*) AS count FROM activity_events WHERE actor_hash = ? AND action = ? AND created_at >= ?")
    .bind(actorHash, action, since).first<{ count: number }>();
  if ((count?.count ?? 0) >= maximum) return false;
  await runtimeEnv.DB.prepare("INSERT INTO activity_events (actor_hash, action, created_at) VALUES (?, ?, ?)")
    .bind(actorHash, action, new Date().toISOString()).run();
  return true;
}

export function getDb() {
  if (!runtimeEnv.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(runtimeEnv.DB, { schema });
}

export function getD1() {
  if (!runtimeEnv.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  return runtimeEnv.DB;
}
