import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureDbSchema, getDb, rateLimit } from "../../../db";
import { reports } from "../../../db/schema";

const reasons = new Set(["harassment", "unsupported-allegation", "copyright", "privacy", "spam", "other"]);

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to report a reader log", signIn: "/signin-with-chatgpt?return_to=/" }, { status: 401 });
  const payload = (await request.json()) as { logId?: number; reason?: string; details?: string };
  const logId = Number(payload.logId);
  const reason = payload.reason ?? "other";
  const details = payload.details?.trim() ?? "";
  if (!Number.isInteger(logId) || logId < 1) return Response.json({ error: "Unknown reader log" }, { status: 400 });
  if (!reasons.has(reason)) return Response.json({ error: "Choose a valid reason" }, { status: 400 });
  if (details.length > 2000) return Response.json({ error: "Report details can be at most 2,000 characters" }, { status: 400 });
  await ensureDbSchema();
  if (!(await rateLimit(user.email, "report", 6, 60))) return Response.json({ error: "Too many reports. Try again later." }, { status: 429 });
  try {
    const [report] = await getDb().insert(reports).values({ logId, reporterEmail: user.email, reason, details }).returning();
    return Response.json({ report }, { status: 201 });
  } catch {
    return Response.json({ error: "You have already reported this log, or it no longer exists." }, { status: 409 });
  }
}
