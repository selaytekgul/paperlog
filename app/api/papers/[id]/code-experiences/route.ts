import { chatGPTSignInPath, getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureDbSchema, getD1, rateLimit } from "../../../../../db";
import { upsertPaper, upsertProfile } from "../../../../../db/helpers";
import type { Paper } from "../../../../../lib/types";

const outcomes = new Set(["reproduced", "partially-reproduced", "did-not-reproduce", "could-not-run"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  await ensureDbSchema();
  const result = await getD1().prepare(`SELECT ce.id, ce.paper_id AS paperId, ce.user_email AS userEmail, ce.display_name AS displayName,
    ce.repository_url AS repositoryUrl, ce.commit_ref AS commitRef, ce.environment, ce.dataset, ce.outcome,
    ce.reproducibility_rating AS reproducibilityRating, ce.notes, ce.artifact_url AS artifactUrl,
    ce.created_at AS createdAt, ce.updated_at AS updatedAt, p.slug AS profileSlug
    FROM code_experiences ce LEFT JOIN profiles p ON p.user_email = ce.user_email WHERE ce.paper_id = ? ORDER BY ce.updated_at DESC`)
    .bind(id).all<Record<string, unknown>>();
  return Response.json({ experiences: result.results.map((row) => ({ ...row, userEmail: undefined, isOwner: user?.email === row.userEmail })) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to publish a reproducibility report", signIn: chatGPTSignInPath(`/paper/${id}`) }, { status: 401 });
  const payload = await request.json() as { repositoryUrl?: string; commitRef?: string; environment?: string; dataset?: string; outcome?: string; reproducibilityRating?: number | null; notes?: string; artifactUrl?: string | null; paper?: Paper };
  const repositoryUrl = payload.repositoryUrl?.trim() ?? "";
  const rating = payload.reproducibilityRating == null ? null : Number(payload.reproducibilityRating);
  if (!/^https?:\/\//.test(repositoryUrl)) return Response.json({ error: "Add a valid repository URL" }, { status: 400 });
  if (!outcomes.has(payload.outcome ?? "")) return Response.json({ error: "Choose a valid outcome" }, { status: 400 });
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) return Response.json({ error: "Reproducibility rating must be between 1 and 5" }, { status: 400 });
  if ((payload.notes?.length ?? 0) > 4000 || (payload.environment?.length ?? 0) > 1200) return Response.json({ error: "Report is too long" }, { status: 400 });
  if (payload.artifactUrl && !/^https?:\/\//.test(payload.artifactUrl)) return Response.json({ error: "Artifact link must be a URL" }, { status: 400 });
  if (!payload.paper || payload.paper.id !== id) return Response.json({ error: "Paper metadata is required" }, { status: 400 });
  if (!(await rateLimit(user.email, "code-experience", 8, 30))) return Response.json({ error: "You’re updating too quickly." }, { status: 429 });
  await ensureDbSchema();
  await Promise.all([upsertPaper(payload.paper), upsertProfile(user.email, user.displayName)]);
  const saved = await getD1().prepare(`INSERT INTO code_experiences (paper_id, user_email, display_name, repository_url, commit_ref, environment, dataset, outcome, reproducibility_rating, notes, artifact_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_email, paper_id) DO UPDATE SET display_name=excluded.display_name, repository_url=excluded.repository_url,
    commit_ref=excluded.commit_ref, environment=excluded.environment, dataset=excluded.dataset, outcome=excluded.outcome, reproducibility_rating=excluded.reproducibility_rating,
    notes=excluded.notes, artifact_url=excluded.artifact_url, updated_at=CURRENT_TIMESTAMP RETURNING id, created_at AS createdAt, updated_at AS updatedAt`)
    .bind(id, user.email, user.displayName, repositoryUrl, payload.commitRef?.trim() ?? "", payload.environment?.trim() ?? "", payload.dataset?.trim() ?? "", payload.outcome, rating, payload.notes?.trim() ?? "", payload.artifactUrl?.trim() || null).first<{ id: number; createdAt: string; updatedAt: string }>();
  return Response.json({ experience: { ...saved, paperId: id, displayName: user.displayName, repositoryUrl, commitRef: payload.commitRef?.trim() ?? "", environment: payload.environment?.trim() ?? "", dataset: payload.dataset?.trim() ?? "", outcome: payload.outcome, reproducibilityRating: rating, notes: payload.notes?.trim() ?? "", artifactUrl: payload.artifactUrl?.trim() || null, isOwner: true } }, { status: 201 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  await ensureDbSchema();
  await getD1().prepare("DELETE FROM code_experiences WHERE paper_id = ? AND user_email = ?").bind(id, user.email).run();
  return Response.json({ deleted: true });
}
