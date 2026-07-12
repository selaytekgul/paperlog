import { desc, eq } from "drizzle-orm";
import { chatGPTSignInPath, getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureDbSchema, getDb } from "../../../../../db";
import { logs, papers } from "../../../../../db/schema";
import type { Paper } from "../../../../../lib/types";

const allowedStatuses = new Set(["first-impression", "skimmed", "read", "studied", "ran-code"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await ensureDbSchema();
    const rows = await getDb().select().from(logs).where(eq(logs.paperId, id)).orderBy(desc(logs.updatedAt));
    return Response.json({ logs: rows });
  } catch {
    return Response.json({ logs: [] });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to publish a log", signIn: chatGPTSignInPath(`/paper/${id}`) }, { status: 401 });

  const payload = (await request.json()) as { rating?: number | null; status?: string; comment?: string; paper?: Paper };
  const rating = payload.rating == null ? null : Number(payload.rating);
  const status = payload.status ?? "read";
  const comment = payload.comment?.trim() ?? "";
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) return Response.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  if (!allowedStatuses.has(status)) return Response.json({ error: "Unknown reading status" }, { status: 400 });
  if (!rating && !comment) return Response.json({ error: "Add a rating or note" }, { status: 400 });
  if (comment.length > 2000) return Response.json({ error: "Reader notes can be at most 2,000 characters" }, { status: 400 });
  if (!payload.paper || payload.paper.id !== id) return Response.json({ error: "Paper metadata is required" }, { status: 400 });

  await ensureDbSchema();
  const db = getDb();
  await db.insert(papers).values({
    id,
    title: payload.paper.title,
    authorsJson: JSON.stringify(payload.paper.authors),
    publicationYear: payload.paper.year,
    venue: payload.paper.venue,
    doi: payload.paper.doi,
    landingPageUrl: payload.paper.landingPageUrl,
    pdfUrl: payload.paper.pdfUrl,
    topic: payload.paper.topic,
  }).onConflictDoUpdate({ target: papers.id, set: { title: payload.paper.title, authorsJson: JSON.stringify(payload.paper.authors), venue: payload.paper.venue, topic: payload.paper.topic } });

  const [saved] = await db.insert(logs).values({ paperId: id, userEmail: user.email, displayName: user.displayName, rating, status, comment })
    .onConflictDoUpdate({ target: [logs.userEmail, logs.paperId], set: { displayName: user.displayName, rating, status, comment, updatedAt: new Date().toISOString() } }).returning();
  return Response.json({ log: saved }, { status: 201 });
}
