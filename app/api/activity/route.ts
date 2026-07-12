import { desc, eq } from "drizzle-orm";
import { ensureDbSchema, getDb } from "../../../db";
import { logs, papers, profiles } from "../../../db/schema";

export async function GET() {
  try {
    await ensureDbSchema();
    const activity = await getDb().select({
      id: logs.id,
      displayName: logs.displayName,
      rating: logs.rating,
      status: logs.status,
      comment: logs.comment,
      createdAt: logs.createdAt,
      paperId: papers.id,
      paperTitle: papers.title,
      profileSlug: profiles.slug,
    }).from(logs).innerJoin(papers, eq(logs.paperId, papers.id)).leftJoin(profiles, eq(logs.userEmail, profiles.userEmail))
      .orderBy(desc(logs.updatedAt)).limit(6);
    return Response.json({ activity });
  } catch {
    return Response.json({ activity: [] });
  }
}
