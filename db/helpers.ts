import { getDb } from ".";
import { papers, profiles } from "./schema";
import type { Paper } from "../lib/types";

export function makeProfileSlug(email: string, displayName: string) {
  const base = displayName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "reader";
  let hash = 2166136261;
  for (const character of email.toLowerCase()) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `${base}-${(hash >>> 0).toString(36).slice(0, 6)}`;
}

export async function upsertProfile(email: string, displayName: string) {
  const db = getDb();
  const slug = makeProfileSlug(email, displayName);
  await db.insert(profiles).values({ userEmail: email, displayName, slug }).onConflictDoUpdate({
    target: profiles.userEmail,
    set: { displayName, updatedAt: new Date().toISOString() },
  });
  return slug;
}

export async function upsertPaper(paper: Paper) {
  await getDb().insert(papers).values({
    id: paper.id,
    title: paper.title,
    authorsJson: JSON.stringify(paper.authors),
    publicationYear: paper.year,
    venue: paper.venue,
    doi: paper.doi,
    landingPageUrl: paper.landingPageUrl,
    pdfUrl: paper.pdfUrl,
    topic: paper.topic,
    arxivId: paper.arxivId ?? null,
    openReviewId: paper.openReviewId ?? null,
    normalizedTitle: paper.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim(),
    metadataUpdatedAt: new Date().toISOString(),
  }).onConflictDoUpdate({ target: papers.id, set: {
    title: paper.title,
    authorsJson: JSON.stringify(paper.authors),
    publicationYear: paper.year,
    venue: paper.venue,
    doi: paper.doi,
    landingPageUrl: paper.landingPageUrl,
    pdfUrl: paper.pdfUrl,
    topic: paper.topic,
    arxivId: paper.arxivId ?? null,
    openReviewId: paper.openReviewId ?? null,
    normalizedTitle: paper.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim(),
    metadataUpdatedAt: new Date().toISOString(),
  } });
}
