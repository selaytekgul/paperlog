import { and, desc, eq } from "drizzle-orm";
import { ensureDbSchema, getD1, getDb } from ".";
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
  const social = await getD1().prepare(`SELECT
    (SELECT COUNT(*) FROM follows WHERE following_email = ?) AS followerCount,
    (SELECT COUNT(*) FROM follows WHERE follower_email = ?) AS followingCount,
    (SELECT COUNT(*) FROM follows WHERE follower_email = ? AND following_email = ?) AS viewerFollowing`)
    .bind(profile.userEmail, profile.userEmail, viewerEmail ?? "", profile.userEmail).first<{ followerCount: number; followingCount: number; viewerFollowing: number }>();
  const listRows = await getD1().prepare(`SELECT l.id, l.name, l.description, l.is_public AS isPublic, i.paper_id AS paperId, i.note,
    p.title, p.authors_json AS authorsJson, p.publication_year AS year, p.venue, p.topic
    FROM paper_lists l LEFT JOIN paper_list_items i ON i.list_id = l.id LEFT JOIN papers p ON p.id = i.paper_id
    WHERE l.user_email = ? AND (l.is_public = 1 OR ? = ?) ORDER BY l.updated_at DESC, i.created_at DESC`)
    .bind(profile.userEmail, viewerEmail ?? "", profile.userEmail).all<Record<string, unknown>>();
  const lists = new Map<number, { id: number; name: string; description: string; isPublic: boolean; items: Array<{ paper: ReturnType<typeof paperFromRow>; note: string }> }>();
  for (const row of listRows.results) {
    const listId = Number(row.id);
    if (!lists.has(listId)) lists.set(listId, { id: listId, name: String(row.name), description: String(row.description ?? ""), isPublic: Boolean(row.isPublic), items: [] });
    if (row.paperId) lists.get(listId)!.items.push({ paper: paperFromRow({ paperId: String(row.paperId), title: String(row.title), authorsJson: String(row.authorsJson), year: row.year == null ? null : Number(row.year), venue: String(row.venue), topic: String(row.topic) }), note: String(row.note ?? "") });
  }
  return {
    displayName: profile.displayName,
    slug: profile.slug,
    bio: profile.bio,
    affiliation: profile.affiliation,
    interests: JSON.parse(profile.interestsJson) as string[],
    followerCount: social?.followerCount ?? 0,
    followingCount: social?.followingCount ?? 0,
    viewerFollowing: Boolean(social?.viewerFollowing),
    isOwner: viewerEmail === profile.userEmail,
    logs: logRows.map((row) => ({ paper: paperFromRow(row), log: { id: row.id, paperId: row.paperId, displayName: profile.displayName, rating: row.rating, status: row.status as PaperLog["status"], comment: row.comment, createdAt: row.createdAt, updatedAt: row.updatedAt, profileSlug: profile.slug } })),
    saved: savedRows.map((row) => ({ paper: paperFromRow(row), savedAt: row.createdAt })),
    lists: [...lists.values()],
  };
}
