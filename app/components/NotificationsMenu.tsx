"use client";

import { useEffect, useState } from "react";

type Notification = { id: number; type: string; paperId: string | null; paperTitle: string | null; actorName: string; actorSlug: string | null; readAt: string | null; createdAt: string };

export function NotificationsMenu() {
  const [items, setItems] = useState<Notification[]>([]); const [open, setOpen] = useState(false);
  useEffect(() => { fetch("/api/notifications").then(async (response) => await response.json() as { notifications?: Notification[] }).then((payload) => setItems(payload.notifications ?? [])); }, []);
  const unread = items.filter((item) => !item.readAt).length;
  async function toggle() { const next = !open; setOpen(next); if (next && unread) { await fetch("/api/notifications", { method: "POST" }); setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }))); } }
  function copy(item: Notification) { if (item.type === "helpful") return `${item.actorName} found your note helpful`; if (item.type === "reply") return `${item.actorName} replied to your note`; if (item.type === "follow") return `${item.actorName} followed you`; return `${item.actorName} logged a new paper`; }
  return <div className="notification-wrap"><button className="notification-button" aria-label={`${unread} unread notifications`} aria-expanded={open} onClick={toggle}>◉{unread > 0 && <span>{unread}</span>}</button>{open && <div className="notification-panel"><strong>Notifications</strong>{items.length ? items.map((item) => <a key={item.id} href={item.paperId ? `/paper/${item.paperId}` : item.actorSlug ? `/reader/${item.actorSlug}` : "/profile"}><span>{copy(item)}</span>{item.paperTitle && <small>{item.paperTitle}</small>}</a>) : <p>No notifications yet.</p>}</div>}</div>;
}
