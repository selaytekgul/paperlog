import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../chatgpt-auth";
import { AdminConsole } from "../components/AdminConsole";
import { ensureDbSchema, getDb } from "../../db";
import { contactRequests, logs, papers, reports } from "../../db/schema";
import { isPaperlogAdmin } from "../../lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isPaperlogAdmin(user.email)) notFound();
  await ensureDbSchema();
  const db = getDb();
  const reportRows = await db.select({ id: reports.id, reason: reports.reason, details: reports.details, createdAt: reports.createdAt, logId: logs.id, comment: logs.comment, displayName: logs.displayName, paperTitle: papers.title })
    .from(reports).innerJoin(logs, eq(reports.logId, logs.id)).innerJoin(papers, eq(logs.paperId, papers.id)).where(eq(reports.status, "open"));
  const contacts = await db.select().from(contactRequests).where(eq(contactRequests.status, "open"));
  return <div className="paper-page"><header className="topbar"><a className="brand" href="/"><span className="brand-mark" /><span className="brand-name">Paperlog</span></a><div /><div className="top-actions"><a className="nav-link" href="/">Exit admin</a></div></header><main className="content-wrap"><p className="eyebrow">Private moderation</p><h1 className="section-title">Alpha operations</h1><AdminConsole initialReports={reportRows} initialContacts={contacts} /></main></div>;
}
