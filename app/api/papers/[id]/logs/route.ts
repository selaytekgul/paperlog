import { desc, eq } from "drizzle-orm";
import { chatGPTSignInPath, getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureDbSchema, getDb, rateLimit } from "../../../../../db";
import { upsertPaper, upsertProfile } from "../../../../../db/helpers";
import { logs, profiles } from "../../../../../db/schema";
import type { Paper } from "../../../../../lib/types";

const allowedStatuses = new Set(["first-impression", "skimmed", "read", "studied", "ran-code"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const viewer = await getChatGPTUser();
    await ensureDbSchema();
    const rows = await getDb().select({
      id: logs.id,
      paperId: logs.paperId,
      displayName: logs.displayName,
      rating: logs.rating,
      status: logs.status,
      comment: logs.comment,
      createdAt: logs.createdAt,
      updatedAt: logs.updatedAt,
      profileSlug: profiles.slug,
    }).from(logs).leftJoin(profiles, eq(logs.userEmail, profiles.userEmail)).where(eq(logs.paperId, id)).orderBy(desc(logs.updatedAt));
    return Response.json({ logs: rows.map((row) => ({ ...row, isOwner: Boolean(viewer && row.profileSlug && row.profileSlug === makeOwnerSlug(viewer.email, viewer.displayName)) })) });
  } catch {
    return Response.json({ logs: [] });
  }
}

function makeOwnerSlug(email: string, displayName: string) {
  const base = displayName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "reader";
  let hash = 2166136261;
  for (const character of email.toLowerCase()) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `${base}-${(hash >>> 0).toString(36).slice(0, 6)}`;
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
  await getDb().delete(logs).where(eq(logs.id, match.id));
  return Response.json({ deleted: true, remaining: Math.max(0, owned.length - 1) });
}
