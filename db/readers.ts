import { and, desc, eq } from "drizzle-orm";
import { ensureDbSchema, getDb } from ".";
import { upsertProfile } from "./helpers";
import { logs, papers, profiles, readingEntries } from "./schema";
import type { PaperLog } from "../lib/types";

function paperFromRow(row: { paperId: string; title: string; authorsJson: string; year: number | null; venue: string; topic: string }) {
  return { id: row.paperId, title: row.title, authors: JSON.parse(row.authorsJson) as string[], year: row.year, venue: row.venue, topic: row.topic };
}

export async function getReaderByEmail(email: string, displayName: string) {
  await ensureDbSchema();
  const slug = await upsertProfile(email, displayName);
  return getReaderBySlug(slug, email);
}

export async function getReaderBySlug(slug: string, viewerEmail?: string) {
  await ensureDbSchema();
  const db = getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.slug, slug));
  if (!profile) return null;
  const logRows = await db.select({
    id: logs.id, paperId: papers.id, title: papers.title, authorsJson: papers.authorsJson, year: papers.publicationYear,
    venue: papers.venue, topic: papers.topic, rating: logs.rating, status: logs.status, comment: logs.comment,
    createdAt: logs.createdAt, updatedAt: logs.updatedAt,
  }).from(logs).innerJoin(papers, eq(logs.paperId, papers.id)).where(eq(logs.userEmail, profile.userEmail)).orderBy(desc(logs.updatedAt));
  const savedRows = await db.select({
    id: readingEntries.id, paperId: papers.id, title: papers.title, authorsJson: papers.authorsJson, year: papers.publicationYear,
    venue: papers.venue, topic: papers.topic, createdAt: readingEntries.createdAt,
  }).from(readingEntries).innerJoin(papers, eq(readingEntries.paperId, papers.id))
    .where(and(eq(readingEntries.userEmail, profile.userEmail))).orderBy(desc(readingEntries.createdAt));
  return {
    displayName: profile.displayName,
    slug: profile.slug,
    isOwner: viewerEmail === profile.userEmail,
    logs: logRows.map((row) => ({ paper: paperFromRow(row), log: { id: row.id, paperId: row.paperId, displayName: profile.displayName, rating: row.rating, status: row.status as PaperLog["status"], comment: row.comment, createdAt: row.createdAt, updatedAt: row.updatedAt, profileSlug: profile.slug } })),
    saved: savedRows.map((row) => ({ paper: paperFromRow(row), savedAt: row.createdAt })),
  };
}
