"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatGPTUser } from "../chatgpt-auth";
import type { Paper, PaperLog } from "../../lib/types";
import { SearchBox } from "./SearchBox";
import { SiteFooter } from "./SiteFooter";
import { LogSocialActions } from "./LogSocialActions";
import { ReproducibilitySection } from "./ReproducibilitySection";
import { PaperUtilities } from "./PaperUtilities";

function stars(rating: number | null) {
  return rating ? `${"★".repeat(rating)}${"☆".repeat(5 - rating)}` : "Unrated";
}

function statusLabel(status: PaperLog["status"]) {
  return ({ "first-impression": "First impression", skimmed: "Skimmed", read: "Read", studied: "Studied", "ran-code": "Ran the code" })[status];
}

type LogDraft = {
  rating: number | null;
  status: PaperLog["status"];
  comment: string;
};

type PendingLogDraft = LogDraft & {
  paperId: string;
  createdAt: number;
};

const pendingLogLifetime = 30 * 60 * 1000;
const allowedLogStatuses = new Set<PaperLog["status"]>(["first-impression", "skimmed", "read", "studied", "ran-code"]);

function pendingLogKey(paperId: string) {
  return `paperlog:pending-log:${paperId}`;
}

function readPendingLog(paperId: string): PendingLogDraft | null {
  try {
    const raw = window.sessionStorage.getItem(pendingLogKey(paperId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<PendingLogDraft>;
    const validRating = draft.rating === null || (Number.isInteger(draft.rating) && Number(draft.rating) >= 1 && Number(draft.rating) <= 5);
    const valid = draft.paperId === paperId && typeof draft.createdAt === "number" && Date.now() - draft.createdAt <= pendingLogLifetime
      && validRating && typeof draft.status === "string" && allowedLogStatuses.has(draft.status as PaperLog["status"])
      && typeof draft.comment === "string" && draft.comment.length <= 2000;
    if (!valid) {
      window.sessionStorage.removeItem(pendingLogKey(paperId));
      return null;
    }
    return draft as PendingLogDraft;
  } catch {
    return null;
  }
}

function storePendingLog(paperId: string, draft: LogDraft) {
  try {
    window.sessionStorage.setItem(pendingLogKey(paperId), JSON.stringify({ ...draft, paperId, createdAt: Date.now() } satisfies PendingLogDraft));
  } catch {
    // A blocked session store should not prevent the normal sign-in flow.
  }
}

function clearPendingLog(paperId: string) {
  try {
    window.sessionStorage.removeItem(pendingLogKey(paperId));
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}

export function PaperDetail({ paper, user }: { paper: Paper; user: ChatGPTUser | null }) {
  const [logs, setLogs] = useState<PaperLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [saved, setSaved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<PaperLog["status"]>("read");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reporting, setReporting] = useState<PaperLog | null>(null);
  const [reportReason, setReportReason] = useState("other");
  const [reportDetails, setReportDetails] = useState("");
  const [reportState, setReportState] = useState("");
  const [canAuthorRespond, setCanAuthorRespond] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const recoveryAttempted = useRef(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/papers/${paper.id}/logs`).then(async (response) => await response.json() as { logs?: PaperLog[]; canAuthorRespond?: boolean }),
      fetch(`/api/papers/${paper.id}/reading`).then(async (response) => await response.json() as { saved?: boolean }),
    ]).then(([logPayload, readingPayload]) => {
      setLogs(logPayload.logs ?? []);
      setCanAuthorRespond(Boolean(logPayload.canAuthorRespond));
      setSaved(Boolean(readingPayload.saved));
    }).finally(() => setLoadingLogs(false));
  }, [paper.id]);

  useEffect(() => {
    if (!user || loadingLogs || recoveryAttempted.current) return;
    recoveryAttempted.current = true;
    const draft = readPendingLog(paper.id);
    if (!draft) return;

    clearPendingLog(paper.id);
    void Promise.resolve().then(() => {
      setSubmitting(true);
      setSaveNotice("Finishing your review after sign-in…");
      return fetch(`/api/papers/${paper.id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: draft.rating, status: draft.status, comment: draft.comment, paper }),
      });
    }).then(async (response) => {
      const payload = (await response.json()) as { log?: PaperLog; error?: string };
      if (!response.ok || !payload.log) throw new Error(payload.error ?? "Could not save your log");
      setLogs((current) => [{ ...payload.log!, isOwner: true }, ...current.filter((entry) => !entry.isOwner)]);
      setModalOpen(false);
      setSaveNotice("Your review was published after sign-in.");
    }).catch((caught) => {
      setRating(draft.rating ?? 0);
      setStatus(draft.status);
      setComment(draft.comment);
      setModalOpen(true);
      setSaveNotice("");
      setError(caught instanceof Error ? `${caught.message}. Your draft is ready to retry.` : "Could not save your log. Your draft is ready to retry.");
    }).finally(() => setSubmitting(false));
  }, [loadingLogs, paper, user]);

  const ownLog = logs.find((entry) => entry.isOwner);
  const summary = useMemo(() => {
    const rated = logs.filter((log) => log.rating);
    const average = rated.length ? rated.reduce((sum, log) => sum + (log.rating ?? 0), 0) / rated.length : 0;
    return { average, count: rated.length };
  }, [logs]);

  function openLogModal() {
    setRating(ownLog?.rating ?? 0); setStatus(ownLog?.status ?? "read"); setComment(ownLog?.comment ?? ""); setError(""); setModalOpen(true);
  }

  async function submitLog() {
    if (!rating && !comment.trim()) { setError("Add a rating or a short note first."); return; }
    const draft: LogDraft = { rating: rating || null, status, comment };
    if (!user) storePendingLog(paper.id, draft);
    setSubmitting(true); setError(""); setSaveNotice("");
    try {
      const response = await fetch(`/api/papers/${paper.id}/logs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, paper }) });
      const payload = (await response.json()) as { log?: PaperLog; error?: string; signIn?: string };
      if (response.status === 401 && payload.signIn) { window.location.href = payload.signIn; return; }
      if (!response.ok || !payload.log) throw new Error(payload.error ?? "Could not save your log");
      clearPendingLog(paper.id);
      setLogs((current) => [{ ...payload.log!, isOwner: true }, ...current.filter((entry) => !entry.isOwner)]);
      setModalOpen(false);
      setSaveNotice("Your review was published.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save your log"); }
    finally { setSubmitting(false); }
  }

  async function deleteLog() {
    if (!ownLog || !window.confirm("Delete your rating and reader note for this paper?")) return;
    setSubmitting(true); setError("");
    try {
      const response = await fetch(`/api/papers/${paper.id}/logs`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not delete your log");
      setLogs((current) => current.filter((entry) => !entry.isOwner)); setModalOpen(false); setRating(0); setComment("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not delete your log"); }
    finally { setSubmitting(false); }
  }

  async function toggleSaved() {
    const response = await fetch(`/api/papers/${paper.id}/reading`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paper }) });
    const payload = (await response.json()) as { saved?: boolean; signIn?: string; error?: string };
    if (response.status === 401 && payload.signIn) { window.location.href = payload.signIn; return; }
    if (response.ok) setSaved(Boolean(payload.saved)); else setError(payload.error ?? "Could not update your reading list");
  }

  async function submitReport() {
    if (!reporting) return;
    setReportState("sending");
    const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logId: reporting.id, reason: reportReason, details: reportDetails }) });
    const payload = (await response.json()) as { error?: string; signIn?: string };
    if (response.status === 401 && payload.signIn) { window.location.href = payload.signIn; return; }
    if (response.ok) setReportState("sent"); else setReportState(payload.error ?? "Could not submit report");
  }

  function updateLog(next: PaperLog) {
    setLogs((current) => current.map((entry) => entry.id === next.id ? next : entry));
  }

  return (
    <div className="paper-page">
      <header className="topbar"><a className="brand" href="/"><span className="brand-mark" aria-hidden="true" /><span className="brand-name">Paperlog</span></a><SearchBox compact /><div className="top-actions"><a className="nav-link" href="/">Discover</a>{user && <a className="nav-link" href="/profile">My profile</a>}<button className="pill-button" onClick={openLogModal}>{ownLog ? "Edit my log" : "Log this paper"}</button></div></header>
      <main>
        <section className="paper-hero"><a href="/" className="back-link">← Back to discovery</a><div className="paper-hero-grid"><div><div className="paper-venue">{paper.venue} · {paper.year ?? "Unpublished"}</div><h1>{paper.title}</h1><div className="paper-hero-authors">{paper.authors.join(", ") || "Authors unavailable"}</div><div className="paper-actions"><button className="pill-button coral" onClick={openLogModal}>{ownLog ? "Edit my log" : "＋ Log this paper"}</button><button className={`pill-button secondary ${saved ? "saved-button" : ""}`} onClick={toggleSaved}>{saved ? "✓ Saved to read" : "Want to read"}</button></div></div><aside className="paper-stat-card"><div className="big-rating">{summary.average ? summary.average.toFixed(1) : "—"} <small>/ 5</small></div><div className="stars-line">{summary.average ? stars(Math.round(summary.average)) : "☆☆☆☆☆"}</div><div className="stat-copy">{summary.count} reader rating{summary.count === 1 ? "" : "s"} · {logs.length} public log{logs.length === 1 ? "" : "s"}</div></aside></div></section>
        {saveNotice && <div className="success-message paper-save-notice" role="status" aria-live="polite">{saveNotice}</div>}
        <section className="paper-body"><div><div className="paper-abstract"><h2>About this paper</h2><p>{paper.abstract || "An abstract is not available from the current metadata source. You can still read, rate, and discuss this paper on Paperlog."}</p></div><div className="paper-links">{paper.landingPageUrl && <a href={paper.landingPageUrl} target="_blank" rel="noreferrer">View publication ↗</a>}{paper.pdfUrl && <a href={paper.pdfUrl} target="_blank" rel="noreferrer">Open-access PDF ↗</a>}{paper.doi && <a href={paper.doi} target="_blank" rel="noreferrer">DOI ↗</a>}<a href={`https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`} target="_blank" rel="noreferrer">Search Google Scholar ↗</a><span className="section-kicker">{paper.citedByCount.toLocaleString()} citations in OpenAlex</span></div><div className="logs-head"><div><p className="section-kicker">Reader perspectives</p><h2>What people thought</h2></div><button className="pill-button secondary" onClick={openLogModal}>{ownLog ? "Edit your log" : "Add your log"}</button></div>
          {loadingLogs ? <div className="empty-state">Loading reader logs…</div> : logs.length ? logs.map((log) => <article className="log-card" key={log.id}><div className="log-top"><div className="note-user"><a className="avatar" href={log.profileSlug ? `/reader/${log.profileSlug}` : undefined}>{log.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0,2).toUpperCase()}</a><div><a className="user-name" href={log.profileSlug ? `/reader/${log.profileSlug}` : undefined}>{log.displayName}</a><div className="note-context">{new Date(log.updatedAt ?? log.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div></div></div><div><span className="rating">{stars(log.rating)}</span><span className="status-badge">{statusLabel(log.status)}</span></div></div>{log.comment && <p>“{log.comment}”</p>}<LogSocialActions log={log} onChange={updateLog} canAuthorRespond={canAuthorRespond} /><div className="log-actions owner-actions">{log.isOwner ? <button onClick={openLogModal}>Edit or delete</button> : <button onClick={() => { setReporting(log); setReportState(""); setReportDetails(""); }}>Report</button>}</div></article>) : <div className="empty-state"><strong>No reader logs yet.</strong><br />Be the first person to leave an honest impression.</div>}
          <ReproducibilitySection paper={paper} />
          </div><aside><div className="sidebar-card"><h3>Your relationship with the paper matters.</h3><p>A first impression, close reading, or code experience gives other readers useful context.</p><button className="pill-button" onClick={openLogModal}>{ownLog ? "Edit your experience" : "Log your experience"}</button></div><div className="sidebar-card"><h3>Paper details</h3><ul><li>{paper.topic}</li><li>Published {paper.year ?? "date unknown"}</li><li>{paper.authors.length} listed author{paper.authors.length === 1 ? "" : "s"}</li>{paper.arxivId && <li>arXiv {paper.arxivId}</li>}<li>Metadata from OpenAlex</li></ul></div><div className="sidebar-card"><h3>Organize and improve</h3><p>Add this paper to a personal list or suggest a metadata/version correction.</p><PaperUtilities paper={paper} /></div></aside></section>
      </main>
      <SiteFooter />

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><div className="log-modal" role="dialog" aria-modal="true" aria-labelledby="log-title"><div className="modal-head"><h2 id="log-title">{ownLog ? "Edit your log" : "Log this paper"}</h2><button className="icon-button" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></div><div className="modal-paper">{paper.title}</div><label className="form-label">Your rating</label><div className="star-picker" aria-label="Choose a star rating">{[1,2,3,4,5].map((value) => <button type="button" className={`star-button ${value <= rating ? "active" : ""}`} aria-label={`${value} star${value > 1 ? "s" : ""}`} key={value} onClick={() => setRating(value)}>★</button>)}</div><label className="form-label" htmlFor="experience">Your experience</label><select id="experience" value={status} onChange={(event) => setStatus(event.target.value as PaperLog["status"])}><option value="first-impression">First impression</option><option value="skimmed">Skimmed</option><option value="read">Read</option><option value="studied">Studied</option><option value="ran-code">Ran the code</option></select><label className="form-label" htmlFor="reader-note">Your note <span className="optional-label">(optional)</span></label><textarea id="reader-note" maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What stayed with you? What was clear, difficult, useful, or surprising?" />{error && <div className="form-error">{error}</div>}<div className="form-foot">{ownLog ? <button className="text-button danger" disabled={submitting} onClick={deleteLog}>Delete my log</button> : <span className="form-note">{user ? `Posting as ${user.displayName}` : "You’ll be asked to sign in before posting."}</span>}<button className="pill-button" disabled={submitting} onClick={submitLog}>{submitting ? "Saving…" : ownLog ? "Save changes" : "Publish log"}</button></div></div></div>}

      {reporting && <div className="modal-backdrop" role="presentation"><div className="log-modal report-modal" role="dialog" aria-modal="true"><div className="modal-head"><h2>Report this log</h2><button className="icon-button" aria-label="Close" onClick={() => setReporting(null)}>×</button></div><p className="modal-paper">Reports are private and reviewed by the Paperlog operator.</p>{reportState === "sent" ? <><p className="success-message">Thank you. The report has been recorded.</p><button className="pill-button" onClick={() => setReporting(null)}>Close</button></> : <><label className="form-label" htmlFor="report-reason">Reason</label><select id="report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)}><option value="harassment">Harassment or personal attack</option><option value="unsupported-allegation">Unsupported misconduct allegation</option><option value="copyright">Copyright</option><option value="privacy">Private information</option><option value="spam">Spam or manipulation</option><option value="other">Other</option></select><label className="form-label" htmlFor="report-details">Details</label><textarea id="report-details" maxLength={2000} value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} placeholder="Explain what the moderator should review." />{reportState && reportState !== "sending" && <p className="form-error">{reportState}</p>}<div className="form-foot"><span /><button className="pill-button" disabled={reportState === "sending"} onClick={submitReport}>{reportState === "sending" ? "Sending…" : "Submit report"}</button></div></>}</div></div>}
    </div>
  );
}
