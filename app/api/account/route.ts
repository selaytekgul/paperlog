import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureDbSchema, getD1, rateLimit } from "../../../db";
import { getReaderByEmail } from "../../../db/readers";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to export your data" }, { status: 401 });
  const reader = await getReaderByEmail(user.email, user.displayName);
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), profile: reader }, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=paperlog-data.json" },
  });
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to delete your account" }, { status: 401 });
  const payload = (await request.json()) as { confirmation?: string };
  if (payload.confirmation !== "DELETE") return Response.json({ error: "Confirmation is required" }, { status: 400 });
  if (!(await rateLimit(user.email, "delete-account", 2, 1440))) return Response.json({ error: "Account deletion was already requested recently." }, { status: 429 });
  await ensureDbSchema();
  const db = getD1();
  await db.batch([
    db.prepare("DELETE FROM helpful_votes WHERE user_email = ? OR log_id IN (SELECT id FROM logs WHERE user_email = ?)").bind(user.email, user.email),
    db.prepare("DELETE FROM replies WHERE user_email = ? OR log_id IN (SELECT id FROM logs WHERE user_email = ?)").bind(user.email, user.email),
    db.prepare("DELETE FROM notifications WHERE user_email = ? OR actor_email = ?").bind(user.email, user.email),
    db.prepare("DELETE FROM follows WHERE follower_email = ? OR following_email = ?").bind(user.email, user.email),
    db.prepare("DELETE FROM paper_list_items WHERE list_id IN (SELECT id FROM paper_lists WHERE user_email = ?)").bind(user.email),
    db.prepare("DELETE FROM paper_lists WHERE user_email = ?").bind(user.email),
    db.prepare("DELETE FROM code_experiences WHERE user_email = ?").bind(user.email),
    db.prepare("DELETE FROM metadata_corrections WHERE reporter_email = ?").bind(user.email),
    db.prepare("DELETE FROM author_claims WHERE user_email = ?").bind(user.email),
    db.prepare("DELETE FROM reports WHERE log_id IN (SELECT id FROM logs WHERE user_email = ?)").bind(user.email),
    db.prepare("DELETE FROM reports WHERE reporter_email = ?").bind(user.email),
    db.prepare("DELETE FROM reading_entries WHERE user_email = ?").bind(user.email),
    db.prepare("DELETE FROM logs WHERE user_email = ?").bind(user.email),
    db.prepare("DELETE FROM profiles WHERE user_email = ?").bind(user.email),
  ]);
  return Response.json({ deleted: true });
}
