import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureDbSchema, getD1 } from "../../../db";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ notifications: [], unreadCount: 0 });
  await ensureDbSchema();
  const result = await getD1().prepare(`SELECT n.id, n.type, n.paper_id AS paperId, n.log_id AS logId, n.read_at AS readAt, n.created_at AS createdAt,
    COALESCE(p.display_name, 'A reader') AS actorName, p.slug AS actorSlug, pa.title AS paperTitle
    FROM notifications n LEFT JOIN profiles p ON p.user_email = n.actor_email LEFT JOIN papers pa ON pa.id = n.paper_id
    WHERE n.user_email = ? ORDER BY n.created_at DESC LIMIT 30`).bind(user.email).all();
  return Response.json({ notifications: result.results, unreadCount: result.results.filter((entry) => !entry.readAt).length });
}

export async function POST() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  await ensureDbSchema();
  await getD1().prepare("UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_email = ? AND read_at IS NULL").bind(user.email).run();
  return Response.json({ read: true });
}
