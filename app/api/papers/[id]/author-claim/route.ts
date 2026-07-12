import { chatGPTSignInPath, getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureDbSchema, getD1, rateLimit } from "../../../../../db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const user = await getChatGPTUser();
  if (!user) return Response.json({ status: null });
  await ensureDbSchema();
  const claim = await getD1().prepare("SELECT status FROM author_claims WHERE paper_id = ? AND user_email = ?").bind(id, user.email).first<{ status: string }>();
  return Response.json({ status: claim?.status ?? null });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to claim authorship", signIn: chatGPTSignInPath(`/paper/${id}`) }, { status: 401 });
  const payload = await request.json() as { evidenceUrl?: string }; const evidenceUrl = payload.evidenceUrl?.trim() ?? "";
  if (!/^https?:\/\//.test(evidenceUrl)) return Response.json({ error: "Provide a public institutional or author-profile URL" }, { status: 400 });
  if (!(await rateLimit(user.email, "author-claim", 3, 1440))) return Response.json({ error: "Too many claim requests." }, { status: 429 });
  await ensureDbSchema();
  await getD1().prepare("INSERT INTO author_claims (paper_id, user_email, evidence_url) VALUES (?, ?, ?) ON CONFLICT(user_email, paper_id) DO UPDATE SET evidence_url = excluded.evidence_url, status = 'pending', reviewed_at = NULL").bind(id, user.email, evidenceUrl).run();
  return Response.json({ status: "pending" }, { status: 201 });
}
