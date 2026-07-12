import { getChatGPTUser } from "../../../chatgpt-auth";
import { ensureDbSchema, getD1 } from "../../../../db";
import { isPaperlogAdmin } from "../../../../lib/admin";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user || !isPaperlogAdmin(user.email)) return Response.json({ error: "Not found" }, { status: 404 });
  await ensureDbSchema();
  const tableNames = ["papers", "logs", "profiles", "reading_entries", "reports", "contact_requests", "follows", "helpful_votes", "replies", "paper_lists", "paper_list_items", "code_experiences", "metadata_corrections", "author_claims", "moderation_actions"];
  const entries = await Promise.all(tableNames.map(async (name) => [name, (await getD1().prepare(`SELECT * FROM ${name}`).all()).results] as const));
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), schemaVersion: 2, data: Object.fromEntries(entries) }, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="paperlog-backup-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" } });
}
