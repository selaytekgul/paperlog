import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureDbSchema, getD1, rateLimit } from "../../../db";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ lists: [] });
  await ensureDbSchema();
  const result = await getD1().prepare(`SELECT l.id, l.name, l.description, l.is_public AS isPublic, COUNT(i.id) AS itemCount
    FROM paper_lists l LEFT JOIN paper_list_items i ON i.list_id = l.id WHERE l.user_email = ? GROUP BY l.id ORDER BY l.updated_at DESC`).bind(user.email).all();
  return Response.json({ lists: result.results });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const payload = await request.json() as { name?: string; description?: string; isPublic?: boolean };
  const name = payload.name?.trim() ?? "";
  if (!name || name.length > 80 || (payload.description?.length ?? 0) > 500) return Response.json({ error: "Use a list name under 80 characters" }, { status: 400 });
  if (!(await rateLimit(user.email, "create-list", 8, 60))) return Response.json({ error: "Too many lists created." }, { status: 429 });
  await ensureDbSchema();
  try {
    const list = await getD1().prepare("INSERT INTO paper_lists (user_email, name, description, is_public) VALUES (?, ?, ?, ?) RETURNING id, name, description, is_public AS isPublic")
      .bind(user.email, name, payload.description?.trim() ?? "", payload.isPublic === false ? 0 : 1).first();
    return Response.json({ list }, { status: 201 });
  } catch { return Response.json({ error: "You already have a list with that name" }, { status: 409 }); }
}
