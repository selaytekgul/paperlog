import { getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureDbSchema, getD1 } from "../../../../../db";
import { upsertPaper } from "../../../../../db/helpers";
import type { Paper } from "../../../../../lib/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listId = Number(id);
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const payload = await request.json() as { paper?: Paper; note?: string };
  if (!Number.isInteger(listId) || !payload.paper || (payload.note?.length ?? 0) > 500) return Response.json({ error: "Invalid list item" }, { status: 400 });
  await ensureDbSchema();
  const owned = await getD1().prepare("SELECT id FROM paper_lists WHERE id = ? AND user_email = ?").bind(listId, user.email).first();
  if (!owned) return Response.json({ error: "List not found" }, { status: 404 });
  await upsertPaper(payload.paper);
  await getD1().prepare("INSERT INTO paper_list_items (list_id, paper_id, note) VALUES (?, ?, ?) ON CONFLICT(list_id, paper_id) DO UPDATE SET note = excluded.note").bind(listId, payload.paper.id, payload.note?.trim() ?? "").run();
  await getD1().prepare("UPDATE paper_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(listId).run();
  return Response.json({ saved: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const paperId = new URL(request.url).searchParams.get("paperId") ?? "";
  await ensureDbSchema();
  await getD1().prepare("DELETE FROM paper_list_items WHERE list_id = ? AND paper_id = ? AND list_id IN (SELECT id FROM paper_lists WHERE user_email = ?)").bind(Number(id), paperId, user.email).run();
  return Response.json({ deleted: true });
}
