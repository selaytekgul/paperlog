import { chatGPTSignInPath, getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureDbSchema, getD1, rateLimit } from "../../../../../db";

const fields = new Set(["title", "authors", "year", "venue", "doi", "links", "version", "other"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to suggest a correction", signIn: chatGPTSignInPath(`/paper/${id}`) }, { status: 401 });
  const payload = await request.json() as { field?: string; suggestedValue?: string; evidenceUrl?: string };
  const suggestedValue = payload.suggestedValue?.trim() ?? "";
  if (!fields.has(payload.field ?? "") || !suggestedValue || suggestedValue.length > 2000) return Response.json({ error: "Choose a field and describe the correction" }, { status: 400 });
  if (payload.evidenceUrl && !/^https?:\/\//.test(payload.evidenceUrl)) return Response.json({ error: "Evidence must be a valid URL" }, { status: 400 });
  if (!(await rateLimit(user.email, "metadata-correction", 6, 60))) return Response.json({ error: "Too many corrections. Try again later." }, { status: 429 });
  await ensureDbSchema();
  await getD1().prepare("INSERT INTO metadata_corrections (paper_id, reporter_email, field, suggested_value, evidence_url) VALUES (?, ?, ?, ?, ?)").bind(id, user.email, payload.field, suggestedValue, payload.evidenceUrl?.trim() || null).run();
  return Response.json({ submitted: true }, { status: 201 });
}
