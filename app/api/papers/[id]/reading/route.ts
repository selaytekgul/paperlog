import { and, eq } from "drizzle-orm";
import { chatGPTSignInPath, getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureDbSchema, getDb, rateLimit } from "../../../../../db";
import { upsertPaper, upsertProfile } from "../../../../../db/helpers";
import { readingEntries } from "../../../../../db/schema";
import type { Paper } from "../../../../../lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ saved: false });
  await ensureDbSchema();
  const rows = await getDb().select({ id: readingEntries.id }).from(readingEntries)
    .where(and(eq(readingEntries.paperId, id), eq(readingEntries.userEmail, user.email)));
  return Response.json({ saved: rows.length > 0 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to save papers", signIn: chatGPTSignInPath(`/paper/${id}`) }, { status: 401 });
  if (!(await rateLimit(user.email, "reading-list", 20, 10))) return Response.json({ error: "You’re updating your list too quickly." }, { status: 429 });
  const payload = (await request.json()) as { paper?: Paper };
  if (!payload.paper || payload.paper.id !== id) return Response.json({ error: "Paper metadata is required" }, { status: 400 });
  await ensureDbSchema();
  await Promise.all([upsertPaper(payload.paper), upsertProfile(user.email, user.displayName)]);
  const db = getDb();
  const existing = await db.select({ id: readingEntries.id }).from(readingEntries)
    .where(and(eq(readingEntries.paperId, id), eq(readingEntries.userEmail, user.email)));
  if (existing.length) {
    await db.delete(readingEntries).where(eq(readingEntries.id, existing[0].id));
    return Response.json({ saved: false });
  }
  await db.insert(readingEntries).values({ paperId: id, userEmail: user.email });
  return Response.json({ saved: true }, { status: 201 });
}
