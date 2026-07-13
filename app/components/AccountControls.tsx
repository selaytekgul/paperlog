"use client";

import { useState } from "react";

export function AccountControls() {
  const [error, setError] = useState("");
  async function deleteAccount() {
    const confirmation = window.prompt("This permanently removes your Paperlog profile, sign-in sessions, linked-provider records, and account-linked activity from the live database, including reviews, saved papers, replies, votes, lists, reports, claims, and contact requests submitted with this email. It does not delete your Google, GitHub, or ChatGPT account. Type DELETE to continue.");
    if (confirmation !== "DELETE") return;
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) { setError(payload.error ?? "Could not delete the account"); return; }
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => undefined);
    window.location.href = "/signout?return_to=/";
  }
  return <div className="account-controls"><a className="text-button" href="/api/account">Download all my Paperlog data</a><button className="text-button danger" onClick={deleteAccount}>Permanently delete my Paperlog account</button><p className="form-note">Deletion affects Paperlog, not your Google, GitHub, or ChatGPT account. Download your data first if you want a copy.</p>{error && <p className="form-error">{error}</p>}</div>;
}
