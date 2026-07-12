"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatGPTUser } from "../chatgpt-auth";
import type { Paper, PaperLog } from "../../lib/types";
import { SearchBox } from "./SearchBox";

const sampleLogs: PaperLog[] = [
  { id: "sample-1", paperId: "", displayName: "Leyla Demir", rating: 5, status: "studied", comment: "A paper that rewards returning to it. The central construction feels obvious only after the authors have shown it to you.", createdAt: "2026-07-10T10:00:00Z" },
  { id: "sample-2", paperId: "", displayName: "Jon Bell", rating: 4, status: "read", comment: "Clear contribution and unusually good figures. I would still pair it with a modern survey before implementing anything.", createdAt: "2026-07-08T10:00:00Z" },
];

function stars(rating: number | null) {
  if (!rating) return "Unrated";
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
}

function statusLabel(status: PaperLog["status"]) {
  return ({ "first-impression": "First impression", skimmed: "Skimmed", read: "Read", studied: "Studied", "ran-code": "Ran the code" })[status];
}

export function PaperDetail({ paper, user }: { paper: Paper; user: ChatGPTUser | null }) {
  const [logs, setLogs] = useState<PaperLog[]>(sampleLogs.map((log) => ({ ...log, paperId: paper.id })));
  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<PaperLog["status"]>("read");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/papers/${paper.id}/logs`).then((response) => response.json()).then((payload: { logs?: PaperLog[] }) => {
      if (payload.logs?.length) setLogs(payload.logs);
    }).catch(() => undefined);
  }, [paper.id]);

  const summary = useMemo(() => {
    const rated = logs.filter((log) => log.rating);
    const average = rated.length ? rated.reduce((sum, log) => sum + (log.rating ?? 0), 0) / rated.length : 0;
    return { average, count: rated.length };
  }, [logs]);

  async function submitLog() {
    if (!rating && !comment.trim()) { setError("Add a rating or a short note first."); return; }
    setSubmitting(true); setError("");
    try {
      const response = await fetch(`/api/papers/${paper.id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: rating || null, status, comment, paper }),
      });
      const payload = (await response.json()) as { log?: PaperLog; error?: string; signIn?: string };
      if (response.status === 401 && payload.signIn) { window.location.href = payload.signIn; return; }
      if (!response.ok || !payload.log) throw new Error(payload.error ?? "Could not save your log");
      setLogs((current) => [payload.log!, ...current.filter((entry) => entry.displayName !== payload.log!.displayName)]);
      setModalOpen(false); setComment("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save your log"); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="paper-page">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark" aria-hidden="true" /><span className="brand-name">Paperlog</span></a>
        <SearchBox compact />
        <div className="top-actions"><a className="nav-link" href="/">Discover</a><button className="pill-button" onClick={() => setModalOpen(true)}>Log this paper</button></div>
      </header>
      <main>
        <section className="paper-hero">
          <a href="/" className="back-link">← Back to discovery</a>
          <div className="paper-hero-grid">
            <div>
              <div className="paper-venue">{paper.venue} · {paper.year ?? "Unpublished"}</div>
              <h1>{paper.title}</h1>
              <div className="paper-hero-authors">{paper.authors.join(", ") || "Authors unavailable"}</div>
              <div className="paper-actions">
                <button className="pill-button coral" onClick={() => setModalOpen(true)}>＋ Log this paper</button>
                <button className="pill-button secondary">Want to read</button>
              </div>
            </div>
            <aside className="paper-stat-card">
              <div className="big-rating">{summary.average ? summary.average.toFixed(1) : "—"} <small>/ 5</small></div>
              <div className="stars-line">{summary.average ? stars(Math.round(summary.average)) : "☆☆☆☆☆"}</div>
              <div className="stat-copy">{summary.count} reader rating{summary.count === 1 ? "" : "s"} · {logs.length} public log{logs.length === 1 ? "" : "s"}</div>
            </aside>
          </div>
        </section>

        <section className="paper-body">
          <div>
            <div className="paper-abstract">
              <h2>About this paper</h2>
              <p>{paper.abstract || "An abstract is not available from the current metadata source. You can still read, rate, and discuss this paper on Paperlog."}</p>
            </div>
            <div className="paper-links">
              {paper.landingPageUrl && <a href={paper.landingPageUrl} target="_blank" rel="noreferrer">View publication ↗</a>}
              {paper.pdfUrl && <a href={paper.pdfUrl} target="_blank" rel="noreferrer">Open-access PDF ↗</a>}
              {paper.doi && <a href={paper.doi} target="_blank" rel="noreferrer">DOI ↗</a>}
              <span className="section-kicker">{paper.citedByCount.toLocaleString()} citations in OpenAlex</span>
            </div>
            <div className="logs-head"><div><p className="section-kicker">Reader perspectives</p><h2>What people thought</h2></div><button className="pill-button secondary" onClick={() => setModalOpen(true)}>Add your log</button></div>
            {logs.length ? logs.map((log) => (
              <article className="log-card" key={log.id}>
                <div className="log-top">
                  <div className="note-user"><span className="avatar">{log.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0,2).toUpperCase()}</span><div><div className="user-name">{log.displayName}</div><div className="note-context">{new Date(log.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div></div></div>
                  <div><span className="rating">{stars(log.rating)}</span><span className="status-badge">{statusLabel(log.status)}</span></div>
                </div>
                {log.comment && <p>“{log.comment}”</p>}
                <div className="log-actions">♡ Helpful &nbsp;&nbsp; Reply</div>
              </article>
            )) : <div className="empty-state">No logs yet. Be the first to leave an impression.</div>}
          </div>
          <aside>
            <div className="sidebar-card"><h3>Your relationship with the paper matters.</h3><p>A first impression, close reading, or code experience gives other readers useful context.</p><button className="pill-button" onClick={() => setModalOpen(true)}>Log your experience</button></div>
            <div className="sidebar-card"><h3>Paper details</h3><ul><li>{paper.topic}</li><li>Published {paper.year ?? "date unknown"}</li><li>{paper.authors.length} listed author{paper.authors.length === 1 ? "" : "s"}</li><li>Metadata from OpenAlex</li></ul></div>
          </aside>
        </section>
      </main>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <div className="log-modal" role="dialog" aria-modal="true" aria-labelledby="log-title">
            <div className="modal-head"><h2 id="log-title">Log this paper</h2><button className="icon-button" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></div>
            <div className="modal-paper">{paper.title}</div>
            <label className="form-label">Your rating</label>
            <div className="star-picker" aria-label="Choose a star rating">{[1,2,3,4,5].map((value) => <button type="button" className={`star-button ${value <= rating ? "active" : ""}`} aria-label={`${value} star${value > 1 ? "s" : ""}`} key={value} onClick={() => setRating(value)}>★</button>)}</div>
            <label className="form-label" htmlFor="experience">Your experience</label>
            <select id="experience" value={status} onChange={(event) => setStatus(event.target.value as PaperLog["status"])}><option value="first-impression">First impression</option><option value="skimmed">Skimmed</option><option value="read">Read</option><option value="studied">Studied</option><option value="ran-code">Ran the code</option></select>
            <label className="form-label" htmlFor="reader-note">Your note <span style={{ textTransform: "none", fontWeight: 500 }}>(optional)</span></label>
            <textarea id="reader-note" maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What stayed with you? What was clear, difficult, useful, or surprising?" />
            {error && <div className="form-error">{error}</div>}
            <div className="form-foot"><span className="form-note">{user ? `Posting as ${user.displayName}` : "You’ll be asked to sign in before posting."}</span><button className="pill-button" disabled={submitting} onClick={submitLog}>{submitting ? "Saving…" : "Publish log"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
