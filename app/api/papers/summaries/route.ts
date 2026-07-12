import { ensureDbSchema, getD1 } from "../../../../db";

export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter((id) => /^W\d+$/.test(id)).slice(0, 30);
  if (!ids.length) return Response.json({ summaries: [] });
  await ensureDbSchema();
  const placeholders = ids.map(() => "?").join(",");
  const result = await getD1().prepare(`
    SELECT p.id AS paperId,
      COALESCE(AVG(l.rating), 0) AS averageRating,
      COUNT(l.rating) AS ratingCount,
      COUNT(DISTINCT l.id) AS logCount,
      COUNT(DISTINCT ce.id) AS codeExperienceCount
    FROM papers p
    LEFT JOIN logs l ON l.paper_id = p.id
    LEFT JOIN code_experiences ce ON ce.paper_id = p.id
    WHERE p.id IN (${placeholders})
    GROUP BY p.id
  `).bind(...ids).all<{ paperId: string; averageRating: number; ratingCount: number; logCount: number; codeExperienceCount: number }>();
  const found = new Map(result.results.map((row) => [row.paperId, row]));
  return Response.json({ summaries: ids.map((paperId) => found.get(paperId) ?? { paperId, averageRating: 0, ratingCount: 0, logCount: 0, codeExperienceCount: 0 }) });
}
