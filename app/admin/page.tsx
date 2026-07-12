import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../chatgpt-auth";
import { AdminConsole } from "../components/AdminConsole";
import { ensureDbSchema, getD1, getDb } from "../../db";
import { contactRequests, logs, papers, reports } from "../../db/schema";
import { isPaperlogAdmin } from "../../lib/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isPaperlogAdmin(user.email)) notFound();
  await ensureDbSchema();
  const db = getDb();
  const reportRows = await db.select({ id: reports.id, reason: reports.reason, details: reports.details, createdAt: reports.createdAt, logId: logs.id, comment: logs.comment, displayName: logs.displayName, paperTitle: papers.title })
    .from(reports).innerJoin(logs, eq(reports.logId, logs.id)).innerJoin(papers, eq(logs.paperId, papers.id)).where(eq(reports.status, "open"));
  const contacts = await db.select().from(contactRequests).where(eq(contactRequests.status, "open"));
  const correctionRows = await getD1().prepare("SELECT id, paper_id AS paperId, field, suggested_value AS suggestedValue, evidence_url AS evidenceUrl, created_at AS createdAt FROM metadata_corrections WHERE status = 'open' ORDER BY created_at").all();
  const authorClaimRows = await getD1().prepare("SELECT ac.id, ac.paper_id AS paperId, ac.evidence_url AS evidenceUrl, ac.created_at AS createdAt, p.display_name AS displayName FROM author_claims ac LEFT JOIN profiles p ON p.user_email = ac.user_email WHERE ac.status = 'pending' ORDER BY ac.created_at").all();
  const stats = await getD1().prepare(`SELECT (SELECT COUNT(*) FROM profiles) AS readers, (SELECT COUNT(*) FROM logs) AS logs, (SELECT COUNT(*) FROM papers) AS papers, (SELECT COUNT(*) FROM code_experiences) AS codeReports`).first();
  const corrections = correctionRows.results.map((row) => ({ id: Number(row.id), paperId: String(row.paperId), field: String(row.field), suggestedValue: String(row.suggestedValue), evidenceUrl: row.evidenceUrl ? String(row.evidenceUrl) : null, createdAt: String(row.createdAt) }));
  const authorClaims = authorClaimRows.results.map((row) => ({ id: Number(row.id), paperId: String(row.paperId), displayName: String(row.displayName ?? "Unknown reader"), evidenceUrl: String(row.evidenceUrl), createdAt: String(row.createdAt) }));
  return <div className="paper-page"><header className="topbar"><a className="brand" href="/"><span className="brand-mark" /><span className="brand-name">Paperlog</span></a><div /><div className="top-actions"><a className="nav-link" href="/api/admin/export">Download backup</a><a className="nav-link" href="/">Exit admin</a></div></header><main className="content-wrap"><p className="eyebrow">Private moderation</p><h1 className="section-title">Alpha operations</h1><div className="admin-stats"><span><strong>{Number(stats?.readers ?? 0)}</strong> readers</span><span><strong>{Number(stats?.papers ?? 0)}</strong> papers</span><span><strong>{Number(stats?.logs ?? 0)}</strong> logs</span><span><strong>{Number(stats?.codeReports ?? 0)}</strong> code reports</span></div><AdminConsole initialReports={reportRows} initialContacts={contacts} initialCorrections={corrections} initialAuthorClaims={authorClaims} /></main></div>;
}
