"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("feedback");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setState("sending"); setError("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, category, message }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not submit your request");
      setState("sent"); setMessage("");
    } catch (caught) { setState("error"); setError(caught instanceof Error ? caught.message : "Could not submit your request"); }
  }

  return <form className="contact-form" onSubmit={submit}>
    <label htmlFor="contact-email">Your email</label><input id="contact-email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
    <label htmlFor="contact-category">What is this about?</label><select id="contact-category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="feedback">Alpha feedback</option><option value="privacy">Privacy or data request</option><option value="copyright">Copyright</option><option value="safety">Safety or unlawful content</option><option value="metadata">Paper metadata correction</option><option value="appeal">Moderation appeal</option></select>
    <label htmlFor="contact-message">Message</label><textarea id="contact-message" required minLength={10} maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Include the relevant Paperlog URL and enough detail for us to understand the request." />
    <p className="form-note">We use these details only to review and respond to your request. See the Privacy notice.</p>
    {state === "sent" && <p className="success-message">Your request has been recorded. Thank you.</p>}
    {state === "error" && <p className="form-error">{error}</p>}
    <button className="pill-button" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send request"}</button>
  </form>;
}
