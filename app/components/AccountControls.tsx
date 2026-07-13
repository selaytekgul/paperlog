"use client";

import { useState } from "react";

export function AccountControls() {
  const [error, setError] = useState("");
  async function deleteAccount() {
    const confirmation = window.prompt("This permanently removes your Paperlog profile and account-linked activity from the live database, including reviews, saved papers, replies, votes, lists, reports, claims, and contact requests submitted with this email. It does not delete your ChatGPT account. Type DELETE to continue.");
    if (confirmation !== "DELETE") return;
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) { setError(payload.error ?? "Could not delete the account"); return; }
    window.location.href = "/signout-with-chatgpt?return_to=/";
  }
  return <div className="account-controls"><a className="text-button" href="/api/account">Download all my Paperlog data</a><button className="text-button danger" onClick={deleteAccount}>Permanently delete my Paperlog account</button><p className="form-note">Deletion affects Paperlog, not your ChatGPT account. Download your data first if you want a copy.</p>{error && <p className="form-error">{error}</p>}</div>;
}
