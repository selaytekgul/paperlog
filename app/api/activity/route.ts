import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureDbSchema, getD1 } from "../../../db";

export async function GET(request: Request) {
  try {
    const viewer = await getChatGPTUser();
    await ensureDbSchema();
    const url = new URL(request.url); const scope = url.searchParams.get("scope"); const status = url.searchParams.get("status"); const sort = url.searchParams.get("sort");
    const conditions: string[] = []; const bindings: string[] = [];
    if (scope === "following") { if (!viewer) return Response.json({ activity: [] }); conditions.push("l.user_email IN (SELECT following_email FROM follows WHERE follower_email = ?)"); bindings.push(viewer.email); }
    if (status && ["first-impression", "skimmed", "read", "studied", "ran-code"].includes(status)) { conditions.push("l.status = ?"); bindings.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const order = sort === "helpful" ? "helpfulCount DESC, l.updated_at DESC" : "l.updated_at DESC";
    const result = await getD1().prepare(`SELECT l.id, l.display_name AS displayName, l.rating, l.status, l.comment, l.created_at AS createdAt,
      pa.id AS paperId, pa.title AS paperTitle, p.slug AS profileSlug, (SELECT COUNT(*) FROM helpful_votes hv WHERE hv.log_id = l.id) AS helpfulCount
      FROM logs l INNER JOIN papers pa ON pa.id = l.paper_id LEFT JOIN profiles p ON p.user_email = l.user_email ${where} ORDER BY ${order} LIMIT 12`).bind(...bindings).all();
    return Response.json({ activity: result.results });
  } catch {
    return Response.json({ activity: [] });
  }
}
