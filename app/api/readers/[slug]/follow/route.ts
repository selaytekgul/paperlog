import { chatGPTSignInPath, getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureDbSchema, getD1, rateLimit } from "../../../../../db";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to follow readers", signIn: chatGPTSignInPath(`/reader/${slug}`) }, { status: 401 });
  if (!(await rateLimit(user.email, "follow", 20, 10))) return Response.json({ error: "You’re following too quickly." }, { status: 429 });
  await ensureDbSchema();
  const target = await getD1().prepare("SELECT user_email AS userEmail FROM profiles WHERE slug = ?").bind(slug).first<{ userEmail: string }>();
  if (!target) return Response.json({ error: "Reader not found" }, { status: 404 });
  if (target.userEmail === user.email) return Response.json({ error: "You cannot follow yourself" }, { status: 400 });
  const existing = await getD1().prepare("SELECT id FROM follows WHERE follower_email = ? AND following_email = ?").bind(user.email, target.userEmail).first<{ id: number }>();
  if (existing) await getD1().prepare("DELETE FROM follows WHERE id = ?").bind(existing.id).run();
  else {
    await getD1().prepare("INSERT INTO follows (follower_email, following_email) VALUES (?, ?)").bind(user.email, target.userEmail).run();
    await getD1().prepare("INSERT INTO notifications (user_email, actor_email, type) VALUES (?, ?, 'follow')").bind(target.userEmail, user.email).run();
  }
  const count = await getD1().prepare("SELECT COUNT(*) AS count FROM follows WHERE following_email = ?").bind(target.userEmail).first<{ count: number }>();
  return Response.json({ following: !existing, followerCount: count?.count ?? 0 });
}
