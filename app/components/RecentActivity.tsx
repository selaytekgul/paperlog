"use client";

import { useEffect, useState } from "react";

type Activity = { id: number; displayName: string; rating: number | null; status: string; comment: string; createdAt: string; paperId: string; paperTitle: string; profileSlug: string | null };

export function RecentActivity() {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { fetch("/api/activity").then(async (response) => await response.json() as { activity?: Activity[] }).then((payload) => setActivity(payload.activity ?? [])).finally(() => setLoaded(true)); }, []);
  return <aside className="activity-column"><h3>Fresh from the margins</h3><p className="activity-sub">Real notes from people who are reading.</p>{!loaded ? <p className="empty-state compact">Loading activity…</p> : activity.length ? activity.map((item, index) => <article className="reader-note" key={item.id}><div className="note-user"><a className={`avatar ${index % 2 ? "green" : ""}`} href={item.profileSlug ? `/reader/${item.profileSlug}` : undefined}>{item.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0,2).toUpperCase()}</a><div><a className="user-name" href={item.profileSlug ? `/reader/${item.profileSlug}` : undefined}>{item.displayName}</a><div className="note-context">{item.status.replace("-", " ")}{item.rating ? ` · ${"★".repeat(item.rating)}` : ""}</div></div></div>{item.comment && <blockquote>“{item.comment}”</blockquote>}<a className="note-paper" href={`/paper/${item.paperId}`}>on {item.paperTitle}</a></article>) : <div className="honest-empty"><strong>The margins are still empty.</strong><p>The first real reader logs will appear here.</p></div>}</aside>;
}
