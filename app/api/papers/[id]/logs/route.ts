import { eq } from "drizzle-orm";
import { chatGPTSignInPath, getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureDbSchema, getD1, getDb, rateLimit } from "../../../../../db";
import { upsertPaper, upsertProfile } from "../../../../../db/helpers";
import { logs } from "../../../../../db/schema";
import type { Paper } from "../../../../../lib/types";

const allowedStatuses = new Set(["first-impression", "skimmed", "read", "studied", "ran-code"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const viewer = await getChatGPTUser();
    await ensureDbSchema();
    const result = await getD1().prepare(`SELECT l.id, l.paper_id AS paperId, l.user_email AS userEmail, l.display_name AS displayName,
      l.rating, l.status, l.comment, l.created_at AS createdAt, l.updated_at AS updatedAt, p.slug AS profileSlug,
      (SELECT COUNT(*) FROM helpful_votes hv WHERE hv.log_id = l.id) AS helpfulCount,
      (SELECT COUNT(*) FROM replies r WHERE r.log_id = l.id) AS replyCount,
      (SELECT COUNT(*) FROM helpful_votes hv2 WHERE hv2.log_id = l.id AND hv2.user_email = ?) AS viewerHelpful
      FROM logs l LEFT JOIN profiles p ON p.user_email = l.user_email WHERE l.paper_id = ? ORDER BY l.updated_at DESC`)
      .bind(viewer?.email ?? "", id).all<Record<string, unknown>>();
    const replyRows = await getD1().prepare(`SELECT r.id, r.log_id AS logId, r.paper_id AS paperId, r.user_email AS userEmail,
      r.display_name AS displayName, r.comment, r.author_response AS authorResponse, r.created_at AS createdAt, p.slug AS profileSlug
      FROM replies r LEFT JOIN profiles p ON p.user_email = r.user_email WHERE r.paper_id = ? ORDER BY r.created_at ASC`).bind(id).all<Record<string, unknown>>();
    const repliesByLog = new Map<number, Record<string, unknown>[]>();
    for (const reply of replyRows.results) {
      const logId = Number(reply.logId);
      repliesByLog.set(logId, [...(repliesByLog.get(logId) ?? []), { ...reply, authorResponse: Boolean(reply.authorResponse), isOwner: viewer?.email === reply.userEmail, userEmail: undefined }]);
    }
    const claim = viewer ? await getD1().prepare("SELECT id FROM author_claims WHERE paper_id = ? AND user_email = ? AND status = 'approved'").bind(id, viewer.email).first() : null;
    return Response.json({ canAuthorRespond: Boolean(claim), logs: result.results.map((row) => ({ ...row, userEmail: undefined, helpfulCount: Number(row.helpfulCount), replyCount: Number(row.replyCount), viewerHelpful: Boolean(row.viewerHelpful), isOwner: viewer?.email === row.userEmail, replies: repliesByLog.get(Number(row.id)) ?? [] })) });
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
  if (!(await rateLimit(user.email, "save-log", 12, 10))) return Response.json({ error: "You’re updating too quickly. Try again in a few minutes." }, { status: 429 });

  await ensureDbSchema();
  const db = getDb();
  await Promise.all([upsertPaper(payload.paper), upsertProfile(user.email, user.displayName)]);

  const [saved] = await db.insert(logs).values({ paperId: id, userEmail: user.email, displayName: user.displayName, rating, status, comment })
    .onConflictDoUpdate({ target: [logs.userEmail, logs.paperId], set: { displayName: user.displayName, rating, status, comment, updatedAt: new Date().toISOString() } }).returning();
  const profileSlug = await upsertProfile(user.email, user.displayName);
  await getD1().prepare(`INSERT INTO notifications (user_email, actor_email, type, paper_id, log_id)
    SELECT follower_email, ?, 'new-log', ?, ? FROM follows WHERE following_email = ? AND follower_email != ?`)
    .bind(user.email, id, saved.id, user.email, user.email).run();
  return Response.json({ log: { ...saved, profileSlug } }, { status: 201 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to delete your log", signIn: chatGPTSignInPath(`/paper/${id}`) }, { status: 401 });
  if (!(await rateLimit(user.email, "delete-log", 8, 10))) return Response.json({ error: "You’re making changes too quickly." }, { status: 429 });
  await ensureDbSchema();
  const owned = await getDb().select({ id: logs.id }).from(logs).where(eq(logs.paperId, id)).all();
  const current = await getDb().select({ id: logs.id, email: logs.userEmail }).from(logs).where(eq(logs.paperId, id));
  const match = current.find((entry) => entry.email === user.email);
  if (!match) return Response.json({ error: "Log not found" }, { status: 404 });
  await getD1().prepare("DELETE FROM helpful_votes WHERE log_id = ?").bind(match.id).run();
  await getD1().prepare("DELETE FROM replies WHERE log_id = ?").bind(match.id).run();
  await getDb().delete(logs).where(eq(logs.id, match.id));
  return Response.json({ deleted: true, remaining: Math.max(0, owned.length - 1) });
}
