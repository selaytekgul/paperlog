import { chatGPTSignInPath, getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureDbSchema, getD1, rateLimit } from "../../../../../db";
import { upsertProfile } from "../../../../../db/helpers";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const logId = Number(id);
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to reply", signIn: chatGPTSignInPath("/") }, { status: 401 });
  const payload = await request.json() as { comment?: string; authorResponse?: boolean };
  const comment = payload.comment?.trim() ?? "";
  if (!Number.isInteger(logId) || !comment || comment.length > 1200) return Response.json({ error: "Reply must be between 1 and 1,200 characters" }, { status: 400 });
  if (!(await rateLimit(user.email, "reply", 12, 10))) return Response.json({ error: "You’re replying too quickly." }, { status: 429 });
  await ensureDbSchema();
  const target = await getD1().prepare("SELECT user_email AS userEmail, paper_id AS paperId FROM logs WHERE id = ?").bind(logId).first<{ userEmail: string; paperId: string }>();
  if (!target) return Response.json({ error: "Log not found" }, { status: 404 });
  const profileSlug = await upsertProfile(user.email, user.displayName);
  const claim = payload.authorResponse ? await getD1().prepare("SELECT id FROM author_claims WHERE paper_id = ? AND user_email = ? AND status = 'approved'").bind(target.paperId, user.email).first() : null;
  const isVerifiedAuthor = Boolean(claim);
  const result = await getD1().prepare("INSERT INTO replies (log_id, paper_id, user_email, display_name, comment, author_response) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, created_at AS createdAt")
    .bind(logId, target.paperId, user.email, user.displayName, comment, payload.authorResponse && isVerifiedAuthor ? 1 : 0).first<{ id: number; createdAt: string }>();
  if (target.userEmail !== user.email && result) await getD1().prepare("INSERT INTO notifications (user_email, actor_email, type, paper_id, log_id, reply_id) VALUES (?, ?, 'reply', ?, ?, ?)").bind(target.userEmail, user.email, target.paperId, logId, result.id).run();
  return Response.json({ reply: { ...result, logId, paperId: target.paperId, displayName: user.displayName, comment, authorResponse: Boolean(payload.authorResponse && isVerifiedAuthor), profileSlug, isOwner: true } }, { status: 201 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const replyId = Number(new URL(_request.url).searchParams.get("replyId"));
  if (!Number.isInteger(replyId)) return Response.json({ error: "Invalid reply" }, { status: 400 });
  await ensureDbSchema();
  const result = await getD1().prepare("DELETE FROM replies WHERE id = ? AND log_id = ? AND user_email = ?").bind(replyId, Number(id), user.email).run();
  return result.meta.changes ? Response.json({ deleted: true }) : Response.json({ error: "Reply not found" }, { status: 404 });
}
