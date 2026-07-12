import { ensureDbSchema, rateLimit } from "../../../../db";
import { upsertPaper } from "../../../../db/helpers";
import { getOpenAlexPaper } from "../../../../lib/openalex";

export async function POST(request: Request) {
  const payload = await request.json() as { id?: string };
  const id = payload.id?.trim().toUpperCase() ?? "";
  if (!/^W\d+$/.test(id)) return Response.json({ error: "A valid OpenAlex work ID is required" }, { status: 400 });
  const actor = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
  if (!(await rateLimit(actor, "paper-import", 20, 10))) return Response.json({ error: "Too many paper imports. Try again shortly." }, { status: 429 });
  try {
    const paper = await getOpenAlexPaper(id);
    if (!paper) return Response.json({ error: "Paper not found in OpenAlex" }, { status: 404 });
    await ensureDbSchema();
    await upsertPaper(paper);
    return Response.json({ paper }, { status: 201 });
  } catch {
    return Response.json({ error: "OpenAlex could not verify this paper right now" }, { status: 503 });
  }
}
