import { chatGPTSignInPath, getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureDbSchema, getD1, rateLimit } from "../../../../../db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const logId = Number(id);
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to mark a note helpful", signIn: chatGPTSignInPath("/") }, { status: 401 });
  if (!Number.isInteger(logId)) return Response.json({ error: "Invalid log" }, { status: 400 });
  if (!(await rateLimit(user.email, "helpful-vote", 30, 10))) return Response.json({ error: "You’re voting too quickly." }, { status: 429 });
  await ensureDbSchema();
  const existing = await getD1().prepare("SELECT id FROM helpful_votes WHERE log_id = ? AND user_email = ?").bind(logId, user.email).first<{ id: number }>();
  let helpful: boolean;
  if (existing) {
    await getD1().prepare("DELETE FROM helpful_votes WHERE id = ?").bind(existing.id).run();
    helpful = false;
  } else {
    const target = await getD1().prepare("SELECT user_email AS userEmail, paper_id AS paperId FROM logs WHERE id = ?").bind(logId).first<{ userEmail: string; paperId: string }>();
    if (!target) return Response.json({ error: "Log not found" }, { status: 404 });
    await getD1().prepare("INSERT INTO helpful_votes (log_id, user_email) VALUES (?, ?)").bind(logId, user.email).run();
    if (target.userEmail !== user.email) await getD1().prepare("INSERT INTO notifications (user_email, actor_email, type, paper_id, log_id) VALUES (?, ?, 'helpful', ?, ?)").bind(target.userEmail, user.email, target.paperId, logId).run();
    helpful = true;
  }
  const count = await getD1().prepare("SELECT COUNT(*) AS count FROM helpful_votes WHERE log_id = ?").bind(logId).first<{ count: number }>();
  return Response.json({ helpful, count: count?.count ?? 0 });
}
