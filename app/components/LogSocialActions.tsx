"use client";

import { useState } from "react";
import type { PaperLog, PaperReply } from "../../lib/types";

export function LogSocialActions({ log, onChange, canAuthorRespond = false }: { log: PaperLog; onChange: (next: PaperLog) => void; canAuthorRespond?: boolean }) {
  const [replying, setReplying] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [asAuthor, setAsAuthor] = useState(false);

  async function helpful() {
    setBusy(true); setError("");
    const response = await fetch(`/api/logs/${log.id}/helpful`, { method: "POST" });
    const payload = await response.json() as { helpful?: boolean; count?: number; signIn?: string; error?: string };
    if (response.status === 401 && payload.signIn) { window.location.href = payload.signIn; return; }
    if (response.ok) onChange({ ...log, viewerHelpful: payload.helpful, helpfulCount: payload.count }); else setError(payload.error ?? "Could not save vote");
    setBusy(false);
  }

  async function reply() {
    if (!comment.trim()) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/logs/${log.id}/replies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment, authorResponse: asAuthor }) });
    const payload = await response.json() as { reply?: PaperReply; signIn?: string; error?: string };
    if (response.status === 401 && payload.signIn) { window.location.href = payload.signIn; return; }
    if (response.ok && payload.reply) { onChange({ ...log, replies: [...(log.replies ?? []), payload.reply], replyCount: (log.replies?.length ?? 0) + 1 }); setComment(""); setReplying(false); }
    else setError(payload.error ?? "Could not publish reply");
    setBusy(false);
  }

  async function removeReply(reply: PaperReply) {
    const response = await fetch(`/api/logs/${log.id}/replies?replyId=${reply.id}`, { method: "DELETE" });
    if (response.ok) onChange({ ...log, replies: (log.replies ?? []).filter((item) => item.id !== reply.id) });
  }

  return <div className="social-thread">
    <div className="log-actions social-actions"><button className={log.viewerHelpful ? "active-action" : ""} disabled={busy} onClick={helpful}>♥ Helpful{log.helpfulCount ? ` (${log.helpfulCount})` : ""}</button><button onClick={() => setReplying((value) => !value)}>Reply{log.replies?.length ? ` (${log.replies.length})` : ""}</button></div>
    {(log.replies ?? []).length > 0 && <div className="reply-list">{log.replies!.map((reply) => <div className="reply" key={reply.id}><div><a href={reply.profileSlug ? `/reader/${reply.profileSlug}` : undefined}>{reply.displayName}</a>{reply.authorResponse && <span className="author-badge">Paper author</span>}<span>{new Date(reply.createdAt).toLocaleDateString()}</span></div><p>{reply.comment}</p>{reply.isOwner && <button className="text-button danger" onClick={() => removeReply(reply)}>Delete</button>}</div>)}</div>}
    {replying && <div className="reply-form"><label className="sr-only" htmlFor={`reply-${log.id}`}>Reply to this reader note</label><textarea id={`reply-${log.id}`} maxLength={1200} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add context, ask a question, or share a different reading…" />{canAuthorRespond && <label className="author-response-check"><input type="checkbox" checked={asAuthor} onChange={(event) => setAsAuthor(event.target.checked)} /> Mark as a verified paper-author response</label>}<div><span>{comment.length}/1200</span><button className="pill-button" disabled={busy || !comment.trim()} onClick={reply}>{busy ? "Posting…" : "Post reply"}</button></div></div>}
    {error && <p className="form-error">{error}</p>}
  </div>;
}
