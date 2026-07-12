import { and, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { ensureDbSchema, getD1, getDb } from "../../../../db";
import { contactRequests, logs, metadataCorrections, reports } from "../../../../db/schema";
import { isPaperlogAdmin } from "../../../../lib/admin";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user || !isPaperlogAdmin(user.email)) return Response.json({ error: "Not found" }, { status: 404 });
  const payload = (await request.json()) as { action?: string; id?: number };
  const id = Number(payload.id);
  if (!Number.isInteger(id)) return Response.json({ error: "Invalid record" }, { status: 400 });
  await ensureDbSchema();
  const db = getDb();
  if (payload.action === "resolve-report") await db.update(reports).set({ status: "resolved" }).where(eq(reports.id, id));
  else if (payload.action === "resolve-contact") await db.update(contactRequests).set({ status: "resolved" }).where(eq(contactRequests.id, id));
  else if (payload.action === "resolve-correction") await db.update(metadataCorrections).set({ status: "resolved" }).where(eq(metadataCorrections.id, id));
  else if (payload.action === "approve-author" || payload.action === "reject-author") await getD1().prepare("UPDATE author_claims SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?").bind(payload.action === "approve-author" ? "approved" : "rejected", id).run();
  else if (payload.action === "remove-log") {
    const [report] = await db.select({ logId: reports.logId }).from(reports).where(and(eq(reports.id, id), eq(reports.status, "open")));
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
    await db.delete(reports).where(eq(reports.logId, report.logId));
    await db.delete(logs).where(eq(logs.id, report.logId));
  } else return Response.json({ error: "Unknown action" }, { status: 400 });
  await getD1().prepare("INSERT INTO moderation_actions (admin_email, action, target_type, target_id) VALUES (?, ?, ?, ?)").bind(user.email, payload.action, payload.action?.includes("contact") ? "contact" : payload.action?.includes("correction") ? "correction" : payload.action?.includes("author") ? "author-claim" : "report", String(id)).run();
  return Response.json({ completed: true });
}
