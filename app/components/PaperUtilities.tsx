"use client";

import { useEffect, useState } from "react";
import type { Paper } from "../../lib/types";

type List = { id: number; name: string; itemCount: number };

export function PaperUtilities({ paper }: { paper: Paper }) {
  const [lists, setLists] = useState<List[]>([]);
  const [showLists, setShowLists] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [field, setField] = useState("other");
  const [suggestion, setSuggestion] = useState("");
  const [evidence, setEvidence] = useState("");
  const [message, setMessage] = useState("");
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [claimUrl, setClaimUrl] = useState("");
  useEffect(() => { fetch("/api/lists").then(async (response) => await response.json() as { lists?: List[] }).then((payload) => setLists(payload.lists ?? [])); fetch(`/api/papers/${paper.id}/author-claim`).then(async (response) => await response.json() as { status?: string | null }).then((payload) => setClaimStatus(payload.status ?? null)); }, [paper.id]);
  async function add(listId: number) { const response = await fetch(`/api/lists/${listId}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paper }) }); setMessage(response.ok ? "Added to list." : "Sign in or create a list from your profile first."); }
  async function correction() { const response = await fetch(`/api/papers/${paper.id}/corrections`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ field, suggestedValue: suggestion, evidenceUrl: evidence }) }); const payload = await response.json() as { signIn?: string; error?: string }; if (response.status === 401 && payload.signIn) { window.location.href = payload.signIn; return; } setMessage(response.ok ? "Correction submitted for review." : payload.error ?? "Could not submit correction"); if (response.ok) { setSuggestion(""); setEvidence(""); } }
  async function claim() { const response = await fetch(`/api/papers/${paper.id}/author-claim`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evidenceUrl: claimUrl }) }); const payload = await response.json() as { status?: string; signIn?: string; error?: string }; if (response.status === 401 && payload.signIn) { window.location.href = payload.signIn; return; } if (response.ok) { setClaimStatus(payload.status ?? "pending"); setMessage("Authorship claim submitted for manual verification."); } else setMessage(payload.error ?? "Could not submit claim"); }
  return <div className="paper-utilities"><button className="pill-button secondary block-button" onClick={() => setShowLists((value) => !value)}>Add to a list</button>{showLists && <div className="utility-panel">{lists.length ? lists.map((list) => <button key={list.id} onClick={() => add(list.id)}>{list.name} <span>{list.itemCount}</span></button>) : <a href="/profile">Create a list on your profile →</a>}</div>}<button className="pill-button secondary block-button" onClick={() => setShowCorrection((value) => !value)}>Suggest metadata correction</button>{showCorrection && <div className="utility-panel correction-panel"><select value={field} onChange={(event) => setField(event.target.value)}><option value="title">Title</option><option value="authors">Authors</option><option value="year">Year</option><option value="venue">Venue</option><option value="doi">DOI</option><option value="links">Links</option><option value="version">Version relationship</option><option value="other">Other</option></select><textarea maxLength={2000} value={suggestion} onChange={(event) => setSuggestion(event.target.value)} placeholder="What should change?" /><input value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Evidence URL (optional)" /><button className="pill-button" onClick={correction}>Submit</button></div>}<div className="author-claim">{claimStatus === "approved" ? <span className="author-badge">Verified paper author</span> : claimStatus === "pending" ? <span>Authorship verification pending</span> : <details><summary>Are you an author?</summary><div className="utility-panel"><input value={claimUrl} onChange={(event) => setClaimUrl(event.target.value)} placeholder="Institutional profile or ORCID URL" /><button className="pill-button" onClick={claim}>Request verification</button></div></details>}</div>{message && <p className="form-note utility-message">{message}</p>}</div>;
}
