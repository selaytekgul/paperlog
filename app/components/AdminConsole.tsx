"use client";

import { useState } from "react";

type ReportRow = { id: number; reason: string; details: string; createdAt: string; logId: number; comment: string; displayName: string; paperTitle: string };
type ContactRow = { id: number; email: string; category: string; message: string; createdAt: string };

export function AdminConsole({ initialReports, initialContacts }: { initialReports: ReportRow[]; initialContacts: ContactRow[] }) {
  const [reports, setReports] = useState(initialReports);
  const [contacts, setContacts] = useState(initialContacts);
  async function act(action: string, id: number) {
    const response = await fetch("/api/admin/moderation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id }) });
    if (!response.ok) return;
    if (action === "resolve-report" || action === "remove-log") setReports((rows) => rows.filter((row) => row.id !== id));
    if (action === "resolve-contact") setContacts((rows) => rows.filter((row) => row.id !== id));
  }
  return <div className="admin-grid">
    <section><h2>Open reports</h2>{reports.length ? reports.map((report) => <article className="admin-card" key={report.id}><strong>{report.reason}</strong><span>{report.paperTitle} · {report.displayName}</span><blockquote>“{report.comment}”</blockquote>{report.details && <p>{report.details}</p>}<small>{new Date(report.createdAt).toLocaleString()}</small><div><button className="pill-button secondary" onClick={() => act("resolve-report", report.id)}>Resolve</button><button className="pill-button coral" onClick={() => act("remove-log", report.id)}>Remove log</button></div></article>) : <p className="empty-state">No open reports.</p>}</section>
    <section><h2>Contact requests</h2>{contacts.length ? contacts.map((contact) => <article className="admin-card" key={contact.id}><strong>{contact.category}</strong><span>{contact.email}</span><p>{contact.message}</p><small>{new Date(contact.createdAt).toLocaleString()}</small><button className="pill-button secondary" onClick={() => act("resolve-contact", contact.id)}>Mark resolved</button></article>) : <p className="empty-state">No open contact requests.</p>}</section>
  </div>;
}
