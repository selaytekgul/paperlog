"use client";

import { useState } from "react";

export function AccountControls() {
  const [error, setError] = useState("");
  async function deleteAccount() {
    const confirmation = window.prompt("Type DELETE to permanently remove your Paperlog profile, logs, saved papers, and submitted reports.");
    if (confirmation !== "DELETE") return;
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) { setError(payload.error ?? "Could not delete the account"); return; }
    window.location.href = "/signout-with-chatgpt?return_to=/";
  }
  return <div className="account-controls"><a className="text-button" href="/api/account">Export my data</a><button className="text-button danger" onClick={deleteAccount}>Delete my account</button>{error && <p className="form-error">{error}</p>}</div>;
}
